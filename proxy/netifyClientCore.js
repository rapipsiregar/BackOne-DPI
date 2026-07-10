// proxy/netifyClientCore.js
// ─────────────────────────────────────────────────────────────────────────────
// Core fetch and authentication helpers for Netify DPI API.
// Split from netifyClient.js to keep file sizes under 256 lines.
// ─────────────────────────────────────────────────────────────────────────────

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const axios = require('axios');

const BASE_URL  = process.env.NETIFY_INFORMATICS_BASE_URL || 'https://informatics.netify.ai/api/v1';
const JWT_TOKEN = process.env.NETIFY_TOKEN || process.env.NETIFY_JWT_TOKEN;
const SITE_UUID = process.env.NETIFY_SITE_UUID;

// In-memory map: agent_uuid -> numeric agent ID
const agentMap = {};

function getHeaders() {
  const token = process.env.NETIFY_API_KEY || JWT_TOKEN;
  const headers = { 'x-api-key': token, 'Accept': 'application/json' };
  if (SITE_UUID) headers['x-net-site'] = SITE_UUID;
  return headers;
}

function fixDates(obj) {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) fixDates(obj[i]);
  } else if (obj !== null && typeof obj === 'object') {
    for (const key in obj) {
      if ((key === 'first_seen_at' || key === 'last_seen_at' || key.endsWith('_at')) && obj[key] && typeof obj[key].date === 'string') {
        let d = obj[key].date;
        if (d.includes(' ') && !d.endsWith('Z')) obj[key].date = d.replace(' ', 'T') + 'Z';
        else if (!d.endsWith('Z') && !d.includes('+') && d.includes('T')) obj[key].date = d + 'Z';
      } else if (typeof obj[key] === 'object') {
        fixDates(obj[key]);
      }
    }
  }
}

async function netifyFetch(endpoint, params = {}, agentUuid = null) {
  if (agentUuid) {
    const agentId = agentMap[agentUuid];
    if (agentId) params.filter_agents = `[${agentId}]`;
    else params.settings_agent = agentUuid;
  }

  const token = process.env.NETIFY_API_KEY || JWT_TOKEN;
  if (!token || !SITE_UUID) {
    console.error('[DpiClient] Missing DPI_API_KEY or DPI_SITE_UUID');
    return null;
  }

  try {
    const res = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: getHeaders(), params, timeout: 30000,
    });
    const json = res.data;
    if (json?.status_code !== 0) {
      console.error(`[DpiClient] API Error ${json?.status_code} on ${endpoint}: ${json?.status_message}`);
      return null;
    }
    if (json && json.data) fixDates(json.data);
    return json?.data ?? null;
  } catch (err) {
    const s = err.response?.status;
    const msg = JSON.stringify(err.response?.data ?? err.message);
    console.error(`[DpiClient] ${s ?? 'ERR'} ${endpoint}: ${msg}`);
    return null;
  }
}

module.exports = {
  netifyFetch,
  agentMap,
  BASE_URL,
  SITE_UUID,
};
