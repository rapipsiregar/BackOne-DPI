const axios = require('axios');
const User = require('../models/User');

const PORT_SERVICE_MAP = {
  80: 'HTTP', 443: 'HTTPS / TLS', 8080: 'HTTP Alt', 8443: 'HTTPS Alt',
  53: 'DNS', 5353: 'mDNS', 853: 'DNS-over-TLS',
  25: 'SMTP', 587: 'SMTP TLS', 465: 'SMTPS', 110: 'POP3', 143: 'IMAP',
  22: 'SSH', 23: 'Telnet', 3389: 'RDP', 5900: 'VNC',
  21: 'FTP', 20: 'FTP Data', 989: 'FTPS', 990: 'FTPS Control',
  3306: 'MySQL', 5432: 'PostgreSQL', 6379: 'Redis', 27017: 'MongoDB',
  1194: 'OpenVPN', 51820: 'WireGuard', 500: 'IPSec IKE', 4500: 'IPSec NAT-T',
  67: 'DHCP', 68: 'DHCP Client', 123: 'NTP',
  6881: 'BitTorrent', 6882: 'BitTorrent', 6883: 'BitTorrent',
  9993: 'ZeroTier VPN',
};

function timeRangeToMinutes(timeRange) {
  const mapping = {
    '5m': 5, '10m': 10, '30m': 30, '1h': 60,
    '1d': 1440, '7d': 10080, '30d': 43200, 'all': 43200
  };
  return mapping[timeRange] ?? 60;
}

// Agent UUID → numeric ID cache (to use filter_agents param)
let agentMapCache = null;
let agentCachePopulating = false;

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
    console.log(`[DpiDeviceFetcher] Agent cache populated: ${Object.keys(agentMapCache).length} agents`);
  } catch (e) {
    agentMapCache = {}; // set empty so we don't retry on every request
    console.warn('[DpiDeviceFetcher] Agent cache failed:', e.message);
  } finally {
    agentCachePopulating = false;
  }
}

async function doFetch(ip, agentUuid, BASE_URL, headers, params, siteUuid, token) {
  // Resolve agent numeric ID (needed for filter_agents param)
  await populateAgentCache(BASE_URL, token, siteUuid);
  if (agentUuid && agentMapCache) {
    const agentId = agentMapCache[agentUuid];
    if (agentId) {
      params.filter_agents = `[${agentId}]`;
    }
    // If agent ID not found in cache, proceed without agent filter
    // (do NOT use settings_agent — it's not a valid DPI API param and causes no-filter query)
  }

  const fetchEndpoint = async (endpoint) => {
    const [dl, ul] = await Promise.all([
      axios.get(`${BASE_URL}${endpoint}/download`, { headers, params, timeout: 7000 })
        .catch(() => ({ data: { data: [] } })),
      axios.get(`${BASE_URL}${endpoint}/upload`, { headers, params, timeout: 7000 })
        .catch(() => ({ data: { data: [] } }))
    ]);
    return { dl: dl.data?.data || [], ul: ul.data?.data || [] };
  };

  const [appsRaw, protocolsRaw, domainsRaw, destinationsRaw, flowsRaw] = await Promise.all([
    fetchEndpoint('/data/stats/top/application'),
    fetchEndpoint('/data/stats/top/protocol'),
    fetchEndpoint('/data/stats/top/tls_sni'),
    fetchEndpoint('/data/stats/top/remote_ip'),
    axios.get(`${BASE_URL}/data/flows`, {
      headers, params: { ...params, settings_limit: 1000 }, timeout: 10000
    }).catch(() => ({ data: { data: [] } }))
  ]);

  const mergeMetrics = (raw, getKey) => {
    const map = {};
    raw.dl.forEach(item => {
      const key = getKey(item);
      if (!key) return;
      map[key] = {
        app_label: key,
        download: item.download || 0,
        upload: 0,
        first_seen: item.last_seen_at?.date || new Date().toISOString(),
        last_seen: item.last_seen_at?.date || new Date().toISOString()
      };
    });
    raw.ul.forEach(item => {
      const key = getKey(item);
      if (!key) return;
      if (!map[key]) {
        map[key] = {
          app_label: key,
          download: 0,
          upload: item.upload || 0,
          first_seen: item.last_seen_at?.date || new Date().toISOString(),
          last_seen: item.last_seen_at?.date || new Date().toISOString()
        };
      } else {
        map[key].upload = item.upload || 0;
        if (item.last_seen_at?.date) {
          const itemDate = new Date(item.last_seen_at.date);
          if (itemDate > new Date(map[key].last_seen)) map[key].last_seen = item.last_seen_at.date;
          if (itemDate < new Date(map[key].first_seen)) map[key].first_seen = item.last_seen_at.date;
        }
      }
    });
    return Object.values(map);
  };

  const protocols = mergeMetrics(protocolsRaw, item => item.protocol?.label);
  const domains   = mergeMetrics(domainsRaw, item => item.tls_sni);
  const destinations = mergeMetrics(destinationsRaw, item => item.remote_ip?.address);

  const flowList = flowsRaw.data?.data || [];

  // Aggregate real app names from flows (e.g. "Facebook", "YouTube")
  // More accurate than /top/application when filter_ips is active
  const appsFromFlows = {};
  flowList.forEach(f => {
    const appLabel = f.application?.label || null;
    if (!appLabel) return;
    const dl = f.download || 0;
    const ul = f.upload || 0;
    const ts = f.last_seen_at?.date || new Date().toISOString();
    if (!appsFromFlows[appLabel]) {
      appsFromFlows[appLabel] = { app_label: appLabel, download: dl, upload: ul, first_seen: ts, last_seen: ts };
    } else {
      appsFromFlows[appLabel].download += dl;
      appsFromFlows[appLabel].upload   += ul;
      if (ts > appsFromFlows[appLabel].last_seen)  appsFromFlows[appLabel].last_seen  = ts;
      if (ts < appsFromFlows[appLabel].first_seen) appsFromFlows[appLabel].first_seen = ts;
    }
  });

  const appsFromEndpoint = mergeMetrics(appsRaw, item => item.application?.label);
  const apps = Object.keys(appsFromFlows).length > 0
    ? Object.values(appsFromFlows)
    : appsFromEndpoint;

  console.log(`[DpiDeviceFetcher] ip=${ip} agent=${agentUuid} agentId=${agentMapCache?.[agentUuid] ?? 'n/a'} flows=${flowList.length} apps=${apps.length}`);

  const flows = flowList.map(f => {
    const port = f.remote_port ?? null;
    const portService = port ? (PORT_SERVICE_MAP[port] ?? `Port ${port}`) : null;
    return {
      flow_id:  f.flow_id ? String(f.flow_id) : '',
      src_ip:   f.local_ip?.address  || null,
      dst_ip:   f.remote_ip?.address || null,
      dst_port: port,
      protocol: f.ip_protocol?.label || null,
      app_label: f.application?.label || portService,
      domain:   f.tls_sni || null,
      download: f.download || 0,
      upload:   f.upload   || 0,
      last_seen: f.last_seen_at?.date || null
    };
  });

  const totalDownload = apps.reduce((s, a) => s + a.download, 0)
    || flowList.reduce((s, f) => s + (f.download || 0), 0);
  const totalUpload = apps.reduce((s, a) => s + a.upload, 0)
    || flowList.reduce((s, f) => s + (f.upload || 0), 0);

  let agent_label = agentUuid;
  if (agentUuid) {
    const agentUser = await User.findOne({ agent_uuid: agentUuid, role: 'AGENT_VIEWER' });
    if (agentUser?.account_name) agent_label = agentUser.account_name;
  }

  return {
    total_download: totalDownload,
    total_upload:   totalUpload,
    agent_label,
    flows,
    apps:         apps.sort((a, b) => b.download - a.download),
    protocols:    protocols.sort((a, b) => b.download - a.download),
    domains:      domains.sort((a, b) => b.download - a.download),
    destinations: destinations.sort((a, b) => b.download - a.download).slice(0, 10),
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────
// Hard 12s total timeout (including agent cache lookup) so the Next.js proxy
// never sees ECONNRESET. On timeout, returns null → backend falls back to MongoDB.
module.exports = async function fetchDpiDeviceDetails(ip, timeRange, agentUuid) {
  const token    = process.env.NETIFY_API_KEY || process.env.NETIFY_TOKEN;
  const SITE_UUID = process.env.NETIFY_SITE_UUID;
  if (!token || !SITE_UUID) return null;

  const params = {
    filter_interval: timeRangeToMinutes(timeRange),
    filter_ips: `["${ip}"]`,
    settings_limit: 1000
  };

  const BASE_URL = process.env.NETIFY_INFORMATICS_BASE_URL || 'https://informatics.netify.ai/api/v1';
  const headers  = { 'x-api-key': token, 'Accept': 'application/json', 'x-net-site': SITE_UUID };

  const TOTAL_TIMEOUT_MS = 12000;
  const deadline = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`DpiDeviceFetcher: ${TOTAL_TIMEOUT_MS}ms timeout`)), TOTAL_TIMEOUT_MS)
  );

  try {
    return await Promise.race([
      doFetch(ip, agentUuid, BASE_URL, headers, params, SITE_UUID, token),
      deadline
    ]);
  } catch (err) {
    console.warn(`[DpiDeviceFetcher] Giving up on ip=${ip}: ${err.message}`);
    return null; // backend will fall back to MongoDB
  }
};
