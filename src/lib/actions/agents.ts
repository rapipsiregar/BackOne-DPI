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

      // If API query fails or is empty, use the hardcoded agent list as fallback
      if (apiAgents.length === 0) {
        apiAgents = [
          { agent: { id: 4897042839, uuid: "2F-TF-1D-GK", label: "2F-TF-1D-GK" } },
          { agent: { id: 4895530456, uuid: "8A-V3-PB-85", label: "8A-V3-PB-85" } },
          { agent: { id: 4894730147, uuid: "F6-2V-DT-8A", label: "F6-2V-DT-8A" } },
          { agent: { id: 4895853843, uuid: "1R-79-J9-YE", label: "1R-79-J9-YE" } }
        ];
      }

      const AGENT_MAC_MAP: Record<string, string[]> = {
        '2F-TF-1D-GK': ['60:be:b4:1f:05:96'],
        '8A-V3-PB-85': ['04:f4:1c:ce:c2:e6'],
        'F6-2V-DT-8A': [
          '2c:7b:a0:d8:86:91', '16:11:ac:73:34:1d', 'bc:45:5b:ca:d5:be',
          'de:ed:cc:57:58:34', 'f4:6d:3f:ef:01:a0', '60:be:b4:29:d3:36',
          '60:be:b4:29:d3:33', '60:be:b4:26:4c:d6', '60:be:b4:29:d3:32'
        ],
        '1R-79-J9-YE': [
          '70:85:6c:6d:f7:17', '70:85:6c:81:50:d4', 'a2:cc:8e:7d:39:51',
          'f2:69:9d:a1:5e:11', '8e:91:0f:6e:24:63'
        ],
      };

      const AGENT_LABELS: Record<string, string> = {
        "2F-TF-1D-GK": "JRP Cibubur",
        "8A-V3-PB-85": "IFG LT.18",
        "F6-2V-DT-8A": "CPI Balaraja",
        "1R-79-J9-YE": "CPI Balaraja WAN"
      };

      const latestBwTime = db.prepare("SELECT MAX(fetched_at) as t FROM mac_bandwidth").get()?.t;

      const agents: Agent[] = apiAgents.map((item: any, idx: number) => {
        const uuid = item.agent?.uuid || "";
        const id = item.agent?.id || idx;
        const macs = AGENT_MAC_MAP[uuid] || [];
        
        let dl = 0;
        let ul = 0;
        if (macs.length > 0 && latestBwTime) {
          const placeholders = macs.map(() => '?').join(',');
          const bw = db.prepare(`
            SELECT SUM(download) as dl, SUM(upload) as ul 
            FROM mac_bandwidth 
            WHERE mac_address IN (${placeholders}) AND fetched_at = ?
          `).get(...macs, latestBwTime);
          dl = bw?.dl ?? 0;
          ul = bw?.ul ?? 0;
        }

        const totalMB = ((dl + ul) / (1024 * 1024)).toFixed(2);
        
        return {
          id: id,
          uuid: uuid,
          serial: uuid,
          site_uuid: SITE_UUID || "",
          organization_uuid: "",
          provisioned: true,
          activated: true,
          label: AGENT_LABELS[uuid] || item.agent?.label || uuid,
          created_at: { human: "N/A", date: "", unix_time: 0 },
          updated_at: { human: "N/A", date: "", unix_time: 0 },
          last_seen_at: { 
            human: `Active (Traffic: ${totalMB} MB)`, 
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

