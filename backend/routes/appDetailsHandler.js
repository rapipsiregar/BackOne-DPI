// backend/routes/appDetailsHandler.js
// ─────────────────────────────────────────────────────────────────────────────
// App Detail Handler — reads from MongoDB first (DeviceAppStat + AppStat + Flow)
// Falls back to live DPI API only if MongoDB has zero data for this app+agent
//
// Menggunakan DeviceAppStat sebagai sumber utama untuk top_ips agar sinkron
// dengan data aplikasi di detail perangkat (DeviceDetailModal).
// ─────────────────────────────────────────────────────────────────────────────

const axios = require('axios');
const { AppStat, DeviceAppStat, Flow } = require('../models/Schemas');

// ─── Shared in-memory caches (for DPI API fallback only) ─────────────────────
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

// Resolve agent UUID → DPI numeric agent ID (for filter_agents param)
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
    console.log(`[AppDetailsHandler] Agent cache: ${Object.keys(agentMapCache).length} agents`);
  } catch (e) {
    agentMapCache = {};
    console.warn('[AppDetailsHandler] Agent cache failed:', e.message);
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
      headers, params: { settings_limit: 2000 }, timeout: 8000
    });
    appLookupCache = {};
    if (res.data && Array.isArray(res.data.data)) {
      res.data.data.forEach(a => {
        if (!a.label || !a.id) return;
        let domain = null;
        if (a.home_page?.url) {
          domain = a.home_page.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
        } else if (a.domain_list?.length > 0) {
          domain = a.domain_list[0].label;
        } else {
          domain = a.label.toLowerCase();
        }
        appLookupCache[a.label.toLowerCase()] = { id: a.id, label: a.label, domain };
      });
    }
    console.log(`[AppDetailsHandler] App cache: ${Object.keys(appLookupCache).length} apps`);
  } catch (e) {
    appLookupCache = {};
    console.warn('[AppDetailsHandler] App cache failed:', e.message);
  }
}

// Core DPI fetch for app-details — only used when MongoDB has no data
async function fetchFromDpiApi(label, agentUuid, timeRange, token, siteUuid) {
  const BASE_URL = process.env.NETIFY_INFORMATICS_BASE_URL || 'https://informatics.netify.ai/api/v1';
  const headers  = { 'x-api-key': token, 'Accept': 'application/json', 'x-net-site': siteUuid };

  const TIMEOUT_MS = 12000;
  const deadline = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`AppDetailsHandler: ${TIMEOUT_MS}ms timeout`)), TIMEOUT_MS)
  );

  async function doFetch() {
    await Promise.all([
      populateAgentCache(BASE_URL, token, siteUuid),
      populateAppCache(BASE_URL, token, siteUuid)
    ]);

    const appInfo = appLookupCache?.[label.toLowerCase()];
    if (!appInfo) {
      console.warn(`[AppDetailsHandler] App "${label}" not found in lookup cache`);
      return null;
    }

    const params = {
      filter_interval: timeRangeToMinutes(timeRange),
      filter_applications: `["${appInfo.id}"]`,
      settings_limit: 10000
    };

    if (agentUuid && agentMapCache?.[agentUuid]) {
      params.filter_agents = `[${agentMapCache[agentUuid]}]`;
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

    console.log(`[AppDetailsHandler] DPI API: label=${label} agent=${agentUuid} top_ips=${top_ips.length} dl=${(totalDl/1e9).toFixed(2)}GB`);
    return { top_ips, totalDl, totalUl };
  }

  try {
    return await Promise.race([doFetch(), deadline]);
  } catch (err) {
    console.warn('[AppDetailsHandler] DPI API timeout/error:', err.message);
    return null;
  }
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
module.exports = async function appDetailsHandler(req, res, helpers) {
  const t0 = Date.now();
  try {
    const { getTimeFilter, getBaseFilter } = helpers;
    const label = String(req.query.label ?? '');
    if (!label) return res.status(400).json({ ok: false, message: 'label required' });

    const token     = process.env.NETIFY_API_KEY || process.env.NETIFY_TOKEN;
    const SITE_UUID = process.env.NETIFY_SITE_UUID;

    // Respect timeRange from request
    const timeFilter = getTimeFilter(req);
    const baseFilter = getBaseFilter(req, timeFilter);

    const agentUuid = String(req.query.agent_uuid ?? '') || req.user?.agent_uuid || null;
    if (agentUuid) baseFilter.agent_uuid = agentUuid;

    // ── Step 1: Query DeviceAppStat (Primary source for per-device bandwidth per-app) ──
    const queryFilter = { ...baseFilter, app_label: label };
    const deviceApps = await DeviceAppStat.find(queryFilter).sort({ timestamp: -1 }).lean();

    if (deviceApps.length > 0) {
      // Pre-load application lookup to resolve default domains
      const BASE_URL = process.env.NETIFY_INFORMATICS_BASE_URL || 'https://informatics.netify.ai/api/v1';
      if (token && SITE_UUID) {
        await populateAppCache(BASE_URL, token, SITE_UUID).catch(e => console.warn('[AppDetails] Cache error:', e.message));
      }
      const appMeta = appLookupCache?.[label.toLowerCase()];

      const ipsMap = {};
      deviceApps.forEach(da => {
        const ip = da.ip_address;
        if (!ip) return;

        // Dedup: Hanya gunakan record terbaru dari DeviceAppStat untuk IP ini
        if (!ipsMap[ip] || new Date(da.timestamp) > new Date(ipsMap[ip].timestamp)) {
          const tStr = da.timestamp ? new Date(da.timestamp).toISOString() : new Date().toISOString();
          ipsMap[ip] = {
            ip_address: ip,
            download:   da.download || 0,
            upload:     da.upload   || 0,
            first_seen: da.created_at || tStr,
            last_seen:  da.updated_at || tStr,
            timestamp:  da.timestamp,
            domain:     appMeta?.domain || null,
            protocol:   'HTTPS / TLS'
          };
        }
      });

      // Enrich domain & protocol info from Flow if available
      const flows = await Flow.find({
        ...baseFilter,
        app_label: label
      }).sort({ timestamp: -1 }).limit(100).lean();

      flows.forEach(f => {
        const ip = f.src_ip;
        if (ip && ipsMap[ip]) {
          if (f.domain)   ipsMap[ip].domain   = f.domain;
          if (f.protocol) ipsMap[ip].protocol = f.protocol;
        }
      });

      const top_ips = Object.values(ipsMap)
        .sort((a, b) => (b.download + b.upload) - (a.download + a.upload))
        .map(({ timestamp, ...rest }) => rest); // remove temp timestamp field

      // Ambl total download/upload dari latest AppStat (cumulative global)
      const appStats = await AppStat.find({ ...baseFilter, app_label: label }).sort({ timestamp: -1 }).limit(1).lean();
      const topIpsDl = top_ips.reduce((s, x) => s + x.download, 0);
      const topIpsUl = top_ips.reduce((s, x) => s + x.upload, 0);
      const totalDl  = Math.max(appStats[0]?.download || 0, topIpsDl);
      const totalUl  = Math.max(appStats[0]?.upload   || 0, topIpsUl);

      console.log(`[AppDetails] DeviceAppStat: label=${label} deviceCount=${top_ips.length} dl=${(totalDl/1e9).toFixed(2)}GB time=${Date.now()-t0}ms`);
      return res.json({ ok: true, data: { label, total_download: totalDl, total_upload: totalUl, top_ips } });
    }

    // ── Step 2: Fall back to DPI API only if MongoDB has ZERO data ────────────
    if (token && SITE_UUID) {
      const dpiResult = await fetchFromDpiApi(label, agentUuid, req.query.timeRange, token, SITE_UUID);
      if (dpiResult) {
        console.log(`[AppDetails] DPI fallback: label=${label} time=${Date.now()-t0}ms`);
        return res.json({
          ok: true,
          data: { label, total_download: dpiResult.totalDl, total_upload: dpiResult.totalUl, top_ips: dpiResult.top_ips }
        });
      }
    }

    // ── Step 3: AppStat only fallback (aggregate only, no IP list) ─────────────
    const appStats = await AppStat.find({ ...baseFilter, app_label: label }).sort({ timestamp: -1 }).limit(1).lean();
    const statsDl = appStats[0]?.download || 0;
    const statsUl = appStats[0]?.upload   || 0;

    console.log(`[AppDetails] AppStat fallback: label=${label} dl=${(statsDl/1e9).toFixed(2)}GB time=${Date.now()-t0}ms`);
    return res.json({ ok: true, data: { label, total_download: statsDl, total_upload: statsUl, top_ips: [] } });

  } catch (err) {
    console.error('[AppDetailsHandler] Error:', err);
    return res.status(500).json({ ok: false, message: err.message });
  }
};
