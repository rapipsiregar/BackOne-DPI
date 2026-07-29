import { revalidatePath } from "next/cache";

export const BASE_URL = process.env.BACKONE_BASE_URL || process.env.NETIFY_BASE_URL;
export const API_URL = BASE_URL ? `${BASE_URL}/assets/agents` : "https://manager.netify.ai/api/v1/assets/agents";

export const getApiKey = () => process.env.BACKONE_API_KEY || process.env.NETIFY_API_KEY;
export const getJwtToken = () => process.env.BACKONE_JWT_TOKEN || process.env.NETIFY_JWT_TOKEN;
export const getSiteUuid = () => process.env.BACKONE_SITE_UUID || process.env.NETIFY_SITE_UUID;

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

export const getHeaders = () => {
  const API_KEY = getApiKey();
  const JWT_TOKEN = getJwtToken();
  const SITE_UUID = getSiteUuid();
  
  if (!API_KEY && !JWT_TOKEN) {
    throw new Error("BACKONE_API_KEY or BACKONE_JWT_TOKEN is not set in environment variables");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

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
