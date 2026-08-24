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
import { fetchAgentsFromMongo } from "./agentsMongo";
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
    
    if (user.role === 'TENANT_ADMIN' || user.role === 'AGENT_VIEWER') {
      SITE_UUID = user.site_uuid;
    }

    // All agent data comes from MongoDB agent_registry (single source of truth)
    if (API_KEY && API_KEY.startsWith("sk_db_")) {
      const mongoose = require('mongoose');
      const MONGODB_URI = process.env.MONGODB_URI;
      if (!MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is missing. Connection to central database backone_dpi is required.');
      }

      try {
        if (mongoose.connection.readyState === 0) {
          await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
        }
      } catch (connErr: any) {
        console.error("[getAgents Action] Connection failed:", connErr.message);
        throw connErr;
      }
      const db = mongoose.connection.db;

      return await fetchAgentsFromMongo(db, user, SITE_UUID);
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
