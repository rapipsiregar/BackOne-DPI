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

const { getAppLookupCache, populateAppCache, fetchFromDpiApi } = require('./appDetailsDpiHelper');

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

    let agentUuid = req.user?.agent_uuid || null;
    if (req.user?.role !== 'AGENT_VIEWER') {
      agentUuid = String(req.query.agent_uuid ?? '') || agentUuid;
    }
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
      const appMeta = getAppLookupCache()?.[label.toLowerCase()];

      const ipsMap = {};
      deviceApps.forEach(da => {
        const ip = da.ip_address;
        if (!ip) return;

        if (!ipsMap[ip]) {
          const tStr = da.timestamp ? new Date(da.timestamp).toISOString() : new Date().toISOString();
          ipsMap[ip] = {
            ip_address: ip,
            download:   0,
            upload:     0,
            first_seen: da.created_at || tStr,
            last_seen:  da.updated_at || tStr,
            domain:     appMeta?.domain || null,
            protocol:   'HTTPS / TLS'
          };
        }

        ipsMap[ip].download += da.download || 0;
        ipsMap[ip].upload   += da.upload   || 0;

        const tStr = da.timestamp ? new Date(da.timestamp).toISOString() : null;
        if (tStr && tStr > ipsMap[ip].last_seen) {
          ipsMap[ip].last_seen = tStr;
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
        .sort((a, b) => (b.download + b.upload) - (a.download + a.upload));

      // Ambil total download/upload dari sum AppStat over the time range
      const appStats = await AppStat.find({ ...baseFilter, app_label: label }).lean();
      const totalDl  = appStats.reduce((s, x) => s + (x.download || 0), 0);
      const totalUl  = appStats.reduce((s, x) => s + (x.upload || 0), 0);

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
