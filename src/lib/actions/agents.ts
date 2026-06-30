"use server";

import { revalidatePath } from "next/cache";

const API_URL = process.env.NETIFY_BASE_URL ? `${process.env.NETIFY_BASE_URL}/assets/agents` : "https://manager.netify.ai/api/v1/assets/agents";

// Helper function to get headers
const getHeaders = () => {
  const API_KEY = process.env.NETIFY_API_KEY;
  const JWT_TOKEN = process.env.NETIFY_JWT_TOKEN;
  const SITE_UUID = process.env.NETIFY_SITE_UUID;
  
  if (!API_KEY && !JWT_TOKEN) {
    throw new Error("NETIFY_API_KEY or NETIFY_JWT_TOKEN is not set in environment variables");
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
    const API_KEY = process.env.NETIFY_API_KEY;
    const SITE_UUID = process.env.NETIFY_SITE_UUID;

    // Fallback to Informatics Scorecard Agent if site-scoped API key is used
    if (API_KEY && API_KEY.startsWith("sk_db_")) {
      const headers = getHeaders();
      const [dlRes, ulRes] = await Promise.all([
        fetch('https://informatics.netify.ai/api/v1/data/stats/scorecard/agent/download', { headers, cache: "no-store" }),
        fetch('https://informatics.netify.ai/api/v1/data/stats/scorecard/agent/upload', { headers, cache: "no-store" })
      ]);

      if (!dlRes.ok) {
        throw new Error(`Failed to fetch agents scorecard: ${dlRes.statusText} (${dlRes.status})`);
      }

      const dlResult = await dlRes.json();
      const ulResult = ulRes.ok ? await ulRes.json() : { data: [] };

      const ulMap: Record<string, number> = {};
      if (ulResult.data) {
        for (const item of ulResult.data) {
          if (item.agent?.uuid) {
            ulMap[item.agent.uuid] = item.upload ?? 0;
          }
        }
      }

      const AGENT_LABELS: Record<string, string> = {
        "2F-TF-1D-GK": "JRP Cibubur",
        "8A-V3-PB-85": "IFG LT.18",
        "F6-2V-DT-8A": "CPI Balaraja"
      };

      const agents: Agent[] = (dlResult.data || []).map((item: any, idx: number) => {
        const uuid = item.agent?.uuid || `agent-${idx}`;
        const dl = item.download ?? 0;
        const ul = ulMap[uuid] ?? 0;
        const totalMB = ((dl + ul) / (1024 * 1024)).toFixed(2);
        
        return {
          id: item.agent?.id || idx,
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
    const API_KEY = process.env.NETIFY_API_KEY;
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
    const API_KEY = process.env.NETIFY_API_KEY;
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
    const API_KEY = process.env.NETIFY_API_KEY;
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
    const API_KEY = process.env.NETIFY_API_KEY;
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

