"use server";

import { revalidatePath } from "next/cache";

const BASE_URL = process.env.BACKONE_BASE_URL || process.env.NETIFY_BASE_URL;
const API_URL = BASE_URL ? `${BASE_URL}/assets/agents` : "https://manager.netify.ai/api/v1/assets/agents";

const getApiKey = () => process.env.BACKONE_API_KEY || process.env.NETIFY_API_KEY;
const getJwtToken = () => process.env.BACKONE_JWT_TOKEN || process.env.NETIFY_JWT_TOKEN;
const getSiteUuid = () => process.env.BACKONE_SITE_UUID || process.env.NETIFY_SITE_UUID;

// Helper function to get headers
const getHeaders = () => {
  const API_KEY = getApiKey();
  const JWT_TOKEN = getJwtToken();
  const SITE_UUID = getSiteUuid();
  
  if (!API_KEY && !JWT_TOKEN) {
    throw new Error("BACKONE_API_KEY or BACKONE_JWT_TOKEN is not set in environment variables");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Prioritize long-term API Key as recommended by the DPI API support team
  if (API_KEY) {
    headers["x-api-key"] = API_KEY;
  } else if (JWT_TOKEN) {
    headers["x-api-key"] = JWT_TOKEN;
  }

  if (SITE_UUID) {
    headers["x-net-site"] = SITE_UUID;
  }

  return headers;
};


export interface Agent {
  id: number;
  uuid: string;
  serial: string;
  site_uuid: string;
  organization_uuid: string;
  provisioned: boolean;
  activated: boolean;
  label?: string;
  created_at: { human: string; date: string; unix_time: number };
  updated_at: { human: string; date: string; unix_time: number };
  last_seen_at: { human: string; date: string; unix_time: number };
}

export async function getAgents(clientSiteUuid?: string): Promise<Agent[]> {
  try {
    const API_KEY = getApiKey();
    const SITE_UUID = clientSiteUuid || getSiteUuid();

    // All agent data comes from MongoDB (single source of truth per Rule 13)
    if (API_KEY && API_KEY.startsWith("sk_db_")) {
      const mongoose = require('mongoose');
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/backone_dpi';

      // Connect to MongoDB if not already connected
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(MONGODB_URI);
      }
      const db = mongoose.connection.db;

      const filter: any = {};
      if (SITE_UUID) {
        filter.site_uuid = SITE_UUID;
      }

      // Get all agents from MongoDB summaries collection
      const agentSummaries = await db.collection('summaries')
        .aggregate([
          { $match: filter },
          { $sort: { timestamp: -1 } },
          { $group: { _id: '$agent_uuid', lastSeen: { $first: '$timestamp' }, label: { $first: '$agent_label' } } },
        ]).toArray();

      // Check for any flows recorded in the last 12 hours to determine online status
      const twelveHoursAgo = new Date(Date.now() - 12 * 3600000);
      const activeAgents = await db.collection('flows').distinct('agent_uuid', {
        timestamp: { $gte: twelveHoursAgo }
      });
      const activeAgentsSet = new Set(activeAgents);

      const agents: Agent[] = agentSummaries.map((item: any, idx: number) => {
        const lastSeenDate = item.lastSeen ? new Date(item.lastSeen) : null;
        const isOnline = activeAgentsSet.has(item._id);
        const statusHuman = isOnline
          ? 'Online'
          : lastSeenDate
            ? `Last Seen ${lastSeenDate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB`
            : 'Offline';

        return {
          id: idx + 1,
          uuid: item._id,
          serial: item._id,
          site_uuid: SITE_UUID || '',
          organization_uuid: '',
          provisioned: true,
          activated: isOnline,
          label: item.label || item._id,
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

export async function createAgent(agentId: string, label: string) {
  try {
    const API_KEY = getApiKey();
    if (API_KEY && API_KEY.startsWith("sk_db_")) {
      return { success: false, message: "Aksi ditolak: Site-scoped API Key tidak diperbolehkan membuat Agents." };
    }

    const url = agentId 
      ? `${API_URL}/${encodeURIComponent(agentId)}?label=${encodeURIComponent(label)}`
      : `${API_URL}?label=${encodeURIComponent(label)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: getHeaders(),
    });
    
    const result = await response.json();
    if (!response.ok || result.status_code !== 0) {
      return { success: false, message: result.status_message || response.statusText };
    }
    
    revalidatePath('/agents');
    return { success: true, data: result.data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function updateAgent(agentId: string, label: string) {
  try {
    const API_KEY = getApiKey();
    if (API_KEY && API_KEY.startsWith("sk_db_")) {
      return { success: false, message: "Aksi ditolak: Site-scoped API Key tidak diperbolehkan mengubah Agents." };
    }

    const response = await fetch(`${API_URL}/${encodeURIComponent(agentId)}?label=${encodeURIComponent(label)}`, {
      method: "PATCH",
      headers: getHeaders(),
    });
    
    const result = await response.json();
    if (!response.ok || result.status_code !== 0) {
      return { success: false, message: result.status_message || response.statusText };
    }
    
    revalidatePath('/agents');
    return { success: true, data: result.data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteAgent(agentId: string) {
  try {
    const API_KEY = getApiKey();
    if (API_KEY && API_KEY.startsWith("sk_db_")) {
      return { success: false, message: "Aksi ditolak: Site-scoped API Key tidak diperbolehkan menghapus Agents." };
    }

    const response = await fetch(`${API_URL}/${encodeURIComponent(agentId)}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    
    const result = await response.json();
    if (!response.ok || result.status_code !== 0) {
      return { success: false, message: result.status_message || response.statusText };
    }
    
    revalidatePath('/agents');
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

