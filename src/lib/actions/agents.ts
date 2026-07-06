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

  // Prioritize long-term API Key as recommended by Netify support team
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

export async function getAgents(): Promise<Agent[]> {
  try {
    const API_KEY = getApiKey();
    const SITE_UUID = getSiteUuid();

    // Fallback to Informatics Scorecard Agent if site-scoped API key is used
    if (API_KEY && API_KEY.startsWith("sk_db_")) {
      const Database = require('better-sqlite3');
      const path = require('path');
      const dbPath = path.join(process.cwd(), 'backend', 'netify_data.db');
      const db = new Database(dbPath);

      // Query the Informatics API dynamically for all active agents
      let apiAgents: any[] = [];
      try {
        const res = await fetch("https://informatics.netify.ai/api/v1/data/stats/top/agent/download?filter_interval=43200&settings_limit=100", {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "x-api-key": API_KEY,
            "x-net-site": SITE_UUID || ""
          },
          cache: "no-store"
        });
        if (res.ok) {
          const json = await res.json();
          apiAgents = json.data || [];
        }
      } catch (err) {
        console.error("Failed to fetch dynamic agents from Netify API:", err);
      }

      // If API query fails, apiAgents will be empty. We still process from knownAgents.
      const knownAgents = db.prepare('SELECT DISTINCT agent_uuid FROM users WHERE agent_uuid IS NOT NULL').all().map((r: any) => r.agent_uuid);
      
      const agentMap = new Map<string, any>();
      
      // 1. Add agents that have traffic from the API (Active in last 12 hours = Online)
      apiAgents.forEach((item: any, idx: number) => {
        const uuid = item.agent?.uuid;
        if (uuid) {
          agentMap.set(uuid, {
            id: item.agent.id,
            uuid: uuid,
            label: item.agent.label,
            isOnline: true
          });
        }
      });

      // 2. Add any other configured agents from DB (These might be Last Seen or Offline)
      knownAgents.forEach((uuid: string) => {
        if (!agentMap.has(uuid)) {
          agentMap.set(uuid, {
            id: parseInt(uuid.replace(/[^0-9]/g, '')) || Math.floor(Math.random() * 100000), // Fallback ID
            uuid: uuid,
            label: uuid, // Label diselesaikan oleh frontend via resolveAgentLabel
            isOnline: false
          });
        }
      });

      const agents: Agent[] = Array.from(agentMap.values()).map((item, idx) => {
        let statusHuman = "Offline";
        
        if (item.isOnline) {
          statusHuman = "Online";
        } else {
          // Cari data terakhir dari DB
          const f = db.prepare('SELECT MAX(fetched_at) as t FROM flows WHERE agent_uuid = ?').get(item.uuid)?.t;
          const a = db.prepare('SELECT MAX(fetched_at) as t FROM bandwidth_apps WHERE agent_uuid = ?').get(item.uuid)?.t;
          const e = db.prepare('SELECT MAX(fetched_at) as t FROM events WHERE agent_uuid = ?').get(item.uuid)?.t;
          
          const times = [f, a, e].filter(Boolean);
          if (times.length > 0) {
            times.sort();
            const latest = times[times.length - 1];
            const d = new Date(latest);
            const formatted = d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            statusHuman = `Last Seen ${formatted} WIB`;
          }
        }
        
        return {
          id: item.id || idx,
          uuid: item.uuid,
          serial: item.uuid,
          site_uuid: SITE_UUID || "",
          organization_uuid: "",
          provisioned: true,
          activated: true,
          label: item.label,
          created_at: { human: "N/A", date: "", unix_time: 0 },
          updated_at: { human: "N/A", date: "", unix_time: 0 },
          last_seen_at: { 
            human: statusHuman, 
            date: new Date().toISOString(), 
            unix_time: Date.now() / 1000 
          }
        };
      });

      db.close();
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

