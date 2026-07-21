const axios = require('axios');

let appLookupCache = null;
let agentMapCache  = null;
let agentCachePopulating = false;

function timeRangeToMinutes(timeRange) {
  const mapping = {
    '5m': 5, '10m': 10, '30m': 30, '1h': 60,
    '1d': 1440, '7d': 10080, '30d': 43200, 'all': 43200
  };
  return mapping[timeRange] ?? 60;
}

// Resolve agent UUID → DPI numeric agent ID
async function populateAgentCache(BASE_URL, token, siteUuid) {
  if (agentMapCache !== null || agentCachePopulating) return;
  agentCachePopulating = true;
  try {
    const headers = { 'x-api-key': token, 'Accept': 'application/json' };
    if (siteUuid) headers['x-net-site'] = siteUuid;
    const res = await axios.get(`${BASE_URL}/data/stats/top/agent/download`, {
      headers, params: { filter_interval: 43200, settings_limit: 100 }, timeout: 4000
    });
    agentMapCache = {};
    if (res.data && Array.isArray(res.data.data)) {
      res.data.data.forEach(r => {
        if (r.agent?.uuid && r.agent?.id) agentMapCache[r.agent.uuid] = r.agent.id;
      });
    }
    console.log(`[AppDetailsDpiHelper] Agent cache: ${Object.keys(agentMapCache).length} agents`);
  } catch (e) {
    agentMapCache = {};
    console.warn('[AppDetailsDpiHelper] Agent cache failed:', e.message);
  } finally {
    agentCachePopulating = false;
  }
}

// Resolve app label → DPI application ID
async function populateAppCache(BASE_URL, token, siteUuid) {
  if (appLookupCache !== null) return;
  try {
    const headers = { 'x-api-key': token, 'Accept': 'application/json' };
    if (siteUuid) headers['x-net-site'] = siteUuid;
    const res = await axios.get(`${BASE_URL}/lookup/applications`, {
      headers, params: { settings_limit: 10000 }, timeout: 20000
    });
    appLookupCache = {};
    if (res.data && Array.isArray(res.data.data)) {
      res.data.data.forEach(a => {
        if (!a.id) return;
        const label = (a.label || '').trim();
        if (!label) return;
        let domain = null;
        if (a.home_page?.url) {
          domain = a.home_page.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
        } else if (a.domain_list?.length > 0) {
          domain = a.domain_list[0].label;
        } else {
          domain = label.toLowerCase();
        }
        const entry = { id: a.id, label, domain };
        appLookupCache[label.toLowerCase()] = entry;
        if (a.tag) appLookupCache[a.tag.toLowerCase()] = entry;
      });
    }
    console.log(`[AppDetailsDpiHelper] App cache: ${Object.keys(appLookupCache).length} apps`);
  } catch (e) {
    appLookupCache = {};
    console.warn('[AppDetailsDpiHelper] App cache failed:', e.message);
  }
}

// Core DPI fetch for app-details
async function fetchFromDpiApi(label, agentUuid, timeRange, token, siteUuid) {
  const BASE_URL = process.env.NETIFY_INFORMATICS_BASE_URL || 'https://informatics.netify.ai/api/v1';
  const headers  = { 'x-api-key': token, 'Accept': 'application/json', 'x-net-site': siteUuid };

  const TIMEOUT_MS = 12000;
  const deadline = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`AppDetailsDpiHelper: ${TIMEOUT_MS}ms timeout`)), TIMEOUT_MS)
  );

  async function doFetch() {
    await Promise.all([
      populateAgentCache(BASE_URL, token, siteUuid),
      populateAppCache(BASE_URL, token, siteUuid)
    ]);

    const appInfo = appLookupCache?.[label.toLowerCase()];
    if (!appInfo) {
      console.warn(`[AppDetailsDpiHelper] App "${label}" not found in lookup cache`);
      return null;
    }

    const params = {
      filter_interval: timeRangeToMinutes(timeRange),
      filter_applications: `[${appInfo.id}]`,
      settings_limit: 10000
    };

    if (agentUuid && agentMapCache?.[agentUuid]) {
      params.filter_agents = `["${agentMapCache[agentUuid]}"]`;
    }

    const [dlRes, ulRes] = await Promise.all([
      axios.get(`${BASE_URL}/data/stats/top/local_ip/download`, { headers, params, timeout: 10000 }),
      axios.get(`${BASE_URL}/data/stats/top/local_ip/upload`,   { headers, params, timeout: 10000 }),
    ]);

    const ipsMap = {};
    (dlRes.data?.data || []).forEach(item => {
      const ip = item.local_ip?.address;
      if (!ip) return;
      if (!ipsMap[ip]) {
        ipsMap[ip] = {
          ip_address: ip,
          download: item.download || 0,
          upload: 0,
          first_seen: item.last_seen_at?.date || new Date().toISOString(),
          last_seen:  item.last_seen_at?.date || new Date().toISOString(),
          domain: appInfo.domain,
          protocol: 'HTTPS / TLS'
        };
      } else {
        ipsMap[ip].download = item.download || 0;
      }
    });

    (ulRes.data?.data || []).forEach(item => {
      const ip = item.local_ip?.address;
      if (!ip) return;
      if (!ipsMap[ip]) {
        ipsMap[ip] = {
          ip_address: ip,
          download: 0,
          upload: item.upload || 0,
          first_seen: item.last_seen_at?.date || new Date().toISOString(),
          last_seen:  item.last_seen_at?.date || new Date().toISOString(),
          domain: appInfo.domain,
          protocol: 'HTTPS / TLS'
        };
      } else {
        ipsMap[ip].upload = item.upload || 0;
        if (item.last_seen_at?.date) {
          const d = new Date(item.last_seen_at.date);
          if (d > new Date(ipsMap[ip].last_seen))  ipsMap[ip].last_seen  = item.last_seen_at.date;
          if (d < new Date(ipsMap[ip].first_seen)) ipsMap[ip].first_seen = item.last_seen_at.date;
        }
      }
    });

    const top_ips = Object.values(ipsMap).sort((a, b) => (b.download + b.upload) - (a.download + a.upload));
    const totalDl = top_ips.reduce((s, x) => s + x.download, 0);
    const totalUl = top_ips.reduce((s, x) => s + x.upload, 0);

    console.log(`[AppDetailsDpiHelper] DPI API: label=${label} agent=${agentUuid} top_ips=${top_ips.length} dl=${(totalDl/1e9).toFixed(2)}GB`);
    return { top_ips, totalDl, totalUl };
  }

  try {
    return await Promise.race([doFetch(), deadline]);
  } catch (err) {
    console.warn('[AppDetailsDpiHelper] DPI API timeout/error:', err.message);
    return null;
  }
}

module.exports = {
  getAppLookupCache: () => appLookupCache,
  populateAppCache,
  fetchFromDpiApi
};
