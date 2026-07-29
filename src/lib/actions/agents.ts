"use server";

import { 
  getApiKey, 
  getSiteUuid, 
  getHeaders, 
  API_URL, 
  createAgent,
  updateAgent,
  deleteAgent
} from "./agentsCore";
import type { Agent } from "./agentsCore";

import { getAuthUser } from "./authHelper";

// Re-export mutations for backwards compatibility
export { createAgent, updateAgent, deleteAgent };

export async function getAgents(clientSiteUuid?: string): Promise<Agent[]> {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw new Error("Unauthorized: Please log in first.");
    }

    const API_KEY = getApiKey();
    
    // Resolve the SITE_UUID strictly based on user role and permissions
    let SITE_UUID = clientSiteUuid || getSiteUuid();
    
    if (user.role === 'TENANT_ADMIN') {
      SITE_UUID = user.site_uuid;
    } else if (user.role === 'AGENT_VIEWER') {
      SITE_UUID = user.site_uuid;
    }

    // All agent data comes from MongoDB agent_registry (single source of truth)
    // agent_registry is populated by the proxy collector every cycle from /data/agents
    if (API_KEY && API_KEY.startsWith("sk_db_")) {
      const mongoose = require('mongoose');
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/backone_dpi';

      // Connect to MongoDB if not already connected
      console.log("[getAgents Action] MONGODB_URI:", MONGODB_URI);
      console.log("[getAgents Action] Mongoose readyState:", mongoose.connection.readyState);
      try {
        if (mongoose.connection.readyState === 0) {
          console.log("[getAgents Action] Connecting to MongoDB...");
          await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
          console.log("[getAgents Action] ✓ Mongoose connected successfully!");
        }
      } catch (connErr: any) {
        console.error("[getAgents Action] ✗ Mongoose connection failed:", connErr.message);
        throw connErr;
      }
      const db = mongoose.connection.db;

      // Build site filter
      // CATATAN: Untuk company roles, jangan terapkan site_uuid filter global
      // karena agent yang di-assign ke company user bisa berasal dari site mana saja.
      // Filter keamanan untuk company roles HANYA menggunakan uuid: { $in: freshAgentUuids }
      const companyRoles = ['COMPANY_ADMIN', 'COMPANY_OPERATOR', 'COMPANY_VIEWER'];
      const isCompanyRole = companyRoles.includes(user.role);
      
      const filter: any = {};
      // Hanya apply site_uuid filter untuk NON-company roles
      if (SITE_UUID && !isCompanyRole) filter.site_uuid = SITE_UUID;

      // 🔒 Security: COMPANY_ADMIN/OPERATOR/VIEWER hanya boleh melihat agent yang di-assign
      // freshAgentUuids dideklarasikan di outer scope agar bisa dipakai di fallback summaries
      let freshAgentUuids: string[] = [];
      if (isCompanyRole) {
        // Selalu baca agent_uuids dari database — token bisa stale jika assignment berubah setelah login
        freshAgentUuids = user.agent_uuids || [];
        try {
          const UserModel = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ agent_uuids: [String] }, { strict: false }));
          const dbUser = await UserModel.findById(user.id).select('agent_uuids').lean() as any;
          if (dbUser?.agent_uuids && dbUser.agent_uuids.length > 0) {
            freshAgentUuids = dbUser.agent_uuids;
          }
        } catch (dbErr: any) {
          console.warn('[getAgents] Could not fetch fresh agent_uuids from DB, using token:', dbErr.message);
        }

        if (freshAgentUuids.length > 0) {
          filter.uuid = { $in: freshAgentUuids };
        } else {
          // Tidak ada agent yang di-assign → kembalikan list kosong (secure by default)
          console.log(`[getAgents] ${user.role} ${user.username} has no assigned agents — returning []`);
          return [];
        }
      }

      // 1. Get agents from agent_registry (filtered by role)
      const registryAgents = await db.collection('agent_registry')
        .find(filter)
        .sort({ uuid: 1 })
        .toArray();

      // 2. If agent_registry is empty, fall back to summaries
      let agentSource = registryAgents;
      if (registryAgents.length === 0) {
        const summaryFilter: any = { agent_uuid: { $nin: [null, ''], $exists: true } };
        // Hanya apply site_uuid filter untuk non-company roles
        if (SITE_UUID && !isCompanyRole) summaryFilter.site_uuid = SITE_UUID;
        // Apply company role filter on summaries fallback using fresh agent_uuids from DB
        if (isCompanyRole && freshAgentUuids.length > 0) {
          summaryFilter.agent_uuid = { $in: freshAgentUuids };
        } else if (isCompanyRole && freshAgentUuids.length === 0) {
          return [];
        }
        const agentSummaries = await db.collection('summaries')
          .aggregate([
            { $match: summaryFilter },
            { $sort: { timestamp: -1 } },
            { $group: { _id: '$agent_uuid', lastSeen: { $first: '$timestamp' }, label: { $first: '$agent_label' } } },
          ]).toArray();
        // Map summaries to registry-like format
        agentSource = agentSummaries.map((s: any) => ({
          uuid: s._id, serial: s._id, label: s.label, site_uuid: SITE_UUID,
          provisioned: true, activated: true, last_seen_at: s.lastSeen ? { date: s.lastSeen.toISOString() } : null,
        }));
      }





      // 3. Optimize status check and last seen per agent using indexed queries
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600000);
      const agents: Agent[] = [];

      for (let idx = 0; idx < agentSource.length; idx++) {
        const item = agentSource[idx];
        const uuid = item.uuid || item.serial;
        if (!uuid) continue;

        // Check if there was any flow in the last 24 hours to determine online status
        // Using index: { agent_uuid: 1, timestamp: -1 }
        const activeFlow = await db.collection('flows')
          .findOne({ agent_uuid: uuid, timestamp: { $gte: twentyFourHoursAgo } }, { projection: { _id: 1 } });
        const isOnline = !!activeFlow;

        // Check latest timestamp from flows
        // Using index: { agent_uuid: 1, timestamp: -1 }
        const latestFlow = await db.collection('flows')
          .findOne({ agent_uuid: uuid }, { projection: { timestamp: 1 }, sort: { timestamp: -1 } });

        // Check latest timestamp from summaries
        // Using index: { agent_uuid: 1, timestamp: -1 }
        const latestSummary = await db.collection('summaries')
          .findOne({ agent_uuid: uuid }, { projection: { timestamp: 1 }, sort: { timestamp: -1 } });

        const registryLastSeenRaw = item.last_seen_at;
        let lastSeenDate: Date | null = null;
        if (registryLastSeenRaw?.date) {
          lastSeenDate = new Date(registryLastSeenRaw.date);
        } else if (registryLastSeenRaw instanceof Date) {
          lastSeenDate = registryLastSeenRaw;
        } else if (typeof registryLastSeenRaw === 'string') {
          lastSeenDate = new Date(registryLastSeenRaw);
        }

        if (latestFlow && latestFlow.timestamp) {
          const flowDate = new Date(latestFlow.timestamp);
          if (!lastSeenDate || flowDate > lastSeenDate) {
            lastSeenDate = flowDate;
          }
        }
        if (latestSummary && latestSummary.timestamp) {
          const summaryDate = new Date(latestSummary.timestamp);
          if (!lastSeenDate || summaryDate > lastSeenDate) {
            lastSeenDate = summaryDate;
          }
        }

        let statusHuman = 'No Flows Detected';
        if (isOnline) {
          if (lastSeenDate) {
            const now = new Date();
            const isToday = lastSeenDate.getDate() === now.getDate() &&
                            lastSeenDate.getMonth() === now.getMonth() &&
                            lastSeenDate.getFullYear() === now.getFullYear();
            const timeStr = lastSeenDate.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) + ' WIB';
            const dateStr = lastSeenDate.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit' });
            statusHuman = isToday ? `Last seen: ${timeStr}` : `Last seen: ${dateStr} ${timeStr}`;
          } else {
            statusHuman = 'Last seen: Just now';
          }
        }

        agents.push({
          id: idx + 1,
          uuid: uuid,
          serial: item.serial || uuid,
          site_uuid: item.site_uuid || SITE_UUID || '',
          organization_uuid: '',
          provisioned: item.provisioned ?? true,
          activated: true, // All retrieved agents are active/activated on the Netify platform
          label: item.label || uuid,
          created_at: { human: 'N/A', date: '', unix_time: 0 },
          updated_at: { human: 'N/A', date: '', unix_time: 0 },
          last_seen_at: {
            human: statusHuman,
            date: lastSeenDate?.toISOString() || '',
            unix_time: lastSeenDate ? lastSeenDate.getTime() / 1000 : 0,
          },
        });
      }

      return agents;
    }

    const response = await fetch(API_URL, {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("Asset Management Disabled: The configured API key does not have permission to manage provisioning agents (403 Forbidden).");
      }
      throw new Error(`Failed to fetch agents: ${response.statusText} (${response.status})`);
    }
    
    const result = await response.json();
    if (result.status_code !== 0) {
      throw new Error(result.status_message || "Unknown API error");
    }
    
    return result.data || [];
  } catch (error: any) {
    console.error("Error fetching agents:", error);
    throw new Error(error.message || "Failed to retrieve agents inventory.");
  }
}

export async function getAgent(agentId: string): Promise<Agent | null> {
  try {
    const API_KEY = getApiKey();
    if (API_KEY && API_KEY.startsWith("sk_db_")) {
      const agents = await getAgents();
      return agents.find(a => a.uuid === agentId || String(a.id) === agentId) || null;
    }

    const response = await fetch(`${API_URL}/${agentId}`, {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch agent ${agentId}: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error(`Error fetching agent ${agentId}:`, error);
    return null;
  }
}
