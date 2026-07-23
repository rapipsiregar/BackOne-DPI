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

// Re-export mutations for backwards compatibility
export { createAgent, updateAgent, deleteAgent };

export async function getAgents(clientSiteUuid?: string): Promise<Agent[]> {
  try {
    const API_KEY = getApiKey();
    const SITE_UUID = clientSiteUuid || getSiteUuid();

    // All agent data comes from MongoDB agent_registry (single source of truth)
    // agent_registry is populated by the proxy collector every cycle from /data/agents
    if (API_KEY && API_KEY.startsWith("sk_db_")) {
      const mongoose = require('mongoose');
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/backone_dpi';

      // Connect to MongoDB if not already connected
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(MONGODB_URI);
      }
      const db = mongoose.connection.db;

      // Build site filter
      const filter: any = {};
      if (SITE_UUID) filter.site_uuid = SITE_UUID;

      // 1. Get ALL agents from agent_registry
      const registryAgents = await db.collection('agent_registry')
        .find(filter)
        .sort({ uuid: 1 })
        .toArray();

      // 2. If agent_registry is empty, fall back to summaries
      let agentSource = registryAgents;
      if (registryAgents.length === 0) {
        const summaryFilter: any = { agent_uuid: { $nin: [null, ''], $exists: true } };
        if (SITE_UUID) summaryFilter.site_uuid = SITE_UUID;
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

      // 3. Check for any flows recorded in the last 24 hours to determine online status
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600000);
      const activeAgentUuids = await db.collection('flows').distinct('agent_uuid', {
        timestamp: { $gte: twentyFourHoursAgo }
      });
      const activeSet = new Set(activeAgentUuids);

      // Query latest timestamps from flows and summaries to get exact last seen
      const lastSeenFlows = await db.collection('flows')
        .aggregate([
          { $match: { agent_uuid: { $nin: [null, ''], $exists: true } } },
          { $sort: { timestamp: -1 } },
          { $group: { _id: '$agent_uuid', lastSeen: { $first: '$timestamp' } } }
        ]).toArray();

      const lastSeenMap = new Map<string, Date>();
      for (const f of lastSeenFlows) {
        if (f._id && f.lastSeen) {
          lastSeenMap.set(f._id, new Date(f.lastSeen));
        }
      }

      const lastSeenSummaries = await db.collection('summaries')
        .aggregate([
          { $match: { agent_uuid: { $nin: [null, ''], $exists: true } } },
          { $sort: { timestamp: -1 } },
          { $group: { _id: '$agent_uuid', lastSeen: { $first: '$timestamp' } } }
        ]).toArray();

      for (const s of lastSeenSummaries) {
        if (s._id && s.lastSeen) {
          const current = lastSeenMap.get(s._id);
          const date = new Date(s.lastSeen);
          if (!current || date > current) {
            lastSeenMap.set(s._id, date);
          }
        }
      }

      const agents: Agent[] = agentSource.map((item: any, idx: number) => {
        const isOnline = activeSet.has(item.uuid);
        
        // Use last_seen_at from registry, enriched with online status and telemetry
        const lastSeenRaw = item.last_seen_at;
        let lastSeenDate: Date | null = null;
        if (lastSeenRaw?.date) {
          lastSeenDate = new Date(lastSeenRaw.date);
        } else if (lastSeenRaw instanceof Date) {
          lastSeenDate = lastSeenRaw;
        } else if (typeof lastSeenRaw === 'string') {
          lastSeenDate = new Date(lastSeenRaw);
        }

        const telemetryLastSeen = lastSeenMap.get(item.uuid || item.serial);
        if (telemetryLastSeen && (!lastSeenDate || telemetryLastSeen > lastSeenDate)) {
          lastSeenDate = telemetryLastSeen;
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

        return {
          id: idx + 1,
          uuid: item.uuid || item.serial,
          serial: item.serial || item.uuid,
          site_uuid: item.site_uuid || SITE_UUID || '',
          organization_uuid: '',
          provisioned: item.provisioned ?? true,
          activated: true, // All retrieved agents are active/activated on the Netify platform
          label: item.label || item.uuid,
          created_at: { human: 'N/A', date: '', unix_time: 0 },
          updated_at: { human: 'N/A', date: '', unix_time: 0 },
          last_seen_at: {
            human: statusHuman,
            date: lastSeenDate?.toISOString() || '',
            unix_time: lastSeenDate ? lastSeenDate.getTime() / 1000 : 0,
          },
        };
      });

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
