const express = require('express');
const router = express.Router();
const db = require('../database');
const { runPoll } = require('../scheduler');
const { Summary, AppStat, DeviceStat, Flow, Threat } = require('../models/Schemas');

// Helper for time range filter
function getTimeFilter(req) {
  const range = req.query.timeRange || '1h'; // default 1 hour
  const now = new Date();
  let gte;
  if (range === '5m') gte = new Date(now.getTime() - 5 * 60000);
  else if (range === '10m') gte = new Date(now.getTime() - 10 * 60000);
  else if (range === '30m') gte = new Date(now.getTime() - 30 * 60000);
  else if (range === '1h') gte = new Date(now.getTime() - 60 * 60000);
  else if (range === '1d') gte = new Date(now.getTime() - 24 * 3600000);
  else if (range === '7d') gte = new Date(now.getTime() - 7 * 24 * 3600000);
  else if (range === '30d') gte = new Date(now.getTime() - 30 * 24 * 3600000);
  else gte = new Date(now.getTime() - 60 * 60000);
  return { $gte: gte };
}

// Rebrand Netify values dynamically in dashboard responses using safe JSON string serialization
router.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    if (body) {
      try {
        const jsonStr = JSON.stringify(body);
        const sanitizedStr = jsonStr
          .replace(/netify\.unclassified/gi, 'backone.unclassified')
          .replace(/netify\.(?!ai)/gi, 'backone.')
          .replace(/Netify's/g, "BackOne's")
          .replace(/netify's/g, "backone's")
          .replace(/Netify(?!(\.ai))/g, 'BackOne')
          .replace(/netify(?!(\.ai))/g, 'backone');
        body = JSON.parse(sanitizedStr);
      } catch (err) {
        console.error('Error rebranding JSON response:', err);
      }
    }
    return originalJson.call(this, body);
  };
  next();
});


// GET /api/dashboard/summary ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â kartu ringkasan (top of page)
router.get('/summary', (req, res) => {
  const isAgent = req.user?.role === 'AGENT_VIEWER';
  const stats = db.getStats(req.user?.site_uuid, isAgent ? req.user?.agent_uuid : null);
  const timeline = db.getBandwidthTimeline(1, req.user?.site_uuid, isAgent ? req.user?.agent_uuid : null);
  const latest = timeline[0] ?? {};

  let bandwidth_down = latest.total_download ?? 0;
  let bandwidth_up = latest.total_upload ?? 0;
  let active_flows = stats.activeFlows;
  let download_speed = latest.download_speed ?? 0;
  let upload_speed = latest.upload_speed ?? 0;
  let flow_speed = latest.flow_speed ?? 0;

  if (isAgent) {
    const siteTimeline = db.getBandwidthTimeline(1, req.user?.site_uuid, null);
    const siteLatest = siteTimeline[0] ?? {};
    const siteStats = db.getStats(req.user?.site_uuid, null);

    const download_ratio = siteLatest.total_download > 0 ? (bandwidth_down / siteLatest.total_download) : 0;
    const upload_ratio = siteLatest.total_upload > 0 ? (bandwidth_up / siteLatest.total_upload) : 0;
    const flow_ratio = siteStats.activeFlows > 0 ? (stats.activeFlows / siteStats.activeFlows) : download_ratio;

    active_flows = Math.round((siteLatest.total_flows ?? 0) * flow_ratio);
    download_speed = Math.round((siteLatest.download_speed ?? 0) * download_ratio);
    upload_speed = Math.round((siteLatest.upload_speed ?? 0) * upload_ratio);
    flow_speed = Math.round((siteLatest.flow_speed ?? 0) * flow_ratio);
  } else {
    active_flows = latest.total_flows ?? stats.activeFlows;
  }

  res.json({
    ok: true,
    data: {
      total_devices: stats.totalDevices,
      total_threats: stats.totalThreats,
      total_events: stats.totalEvents,
      last_fetch: stats.lastFetch,
      bandwidth_down,
      bandwidth_up,
      active_flows,
      download_speed,
      upload_speed,
      flow_speed,
    }
  });
});

// GET /api/dashboard/apps
router.get('/apps', async (req, res) => {
  const limit = parseInt(req.query.limit ?? 50);
  const skip = parseInt(req.query.skip ?? 0);
  const timeFilter = getTimeFilter(req);
  const query = { timestamp: timeFilter };
  
  if (req.user?.site_uuid) query.site_uuid = req.user.site_uuid;
  if (req.user?.role === 'AGENT_VIEWER' && req.user?.agent_uuid) query.agent_uuid = req.user.agent_uuid;

  try {
    const data = await AppStat.find(query).sort({ timestamp: -1, download: -1 }).skip(skip).limit(limit);
    res.json({ ok: true, data });
  } catch (error) {
    res.json({ ok: false, error: error.message });
  }
});

// GET /api/dashboard/devices
router.get('/devices', async (req, res) => {
  const limit = parseInt(req.query.limit ?? 50);
  const skip = parseInt(req.query.skip ?? 0);
  const timeFilter = getTimeFilter(req);
  const query = { timestamp: timeFilter };

  if (req.user?.site_uuid) query.site_uuid = req.user.site_uuid;
  if (req.user?.role === 'AGENT_VIEWER' && req.user?.agent_uuid) query.agent_uuid = req.user.agent_uuid;

  try {
    const data = await DeviceStat.find(query).sort({ timestamp: -1, download: -1 }).skip(skip).limit(limit);
    const mapped = data.map(d => ({ ...d.toObject(), id: d._id.toString() }));
    res.json({ ok: true, data: mapped });
  } catch (error) {
    res.json({ ok: false, error: error.message });
  }
});

// GET /api/dashboard/flows
router.get('/flows', async (req, res) => {
  const limit = parseInt(req.query.limit ?? 50);
  const skip = parseInt(req.query.skip ?? 0);
  const timeFilter = getTimeFilter(req);
  const query = { timestamp: timeFilter };

  if (req.user?.site_uuid) query.site_uuid = req.user.site_uuid;
  if (req.user?.role === 'AGENT_VIEWER' && req.user?.agent_uuid) query.agent_uuid = req.user.agent_uuid;

  try {

    const data = await Flow.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit);
    res.json({ ok: true, data });
  } catch (error) {
    res.json({ ok: false, error: error.message });
  }
});

// GET /api/dashboard/threats
router.get('/threats', async (req, res) => {
  const limit = parseInt(req.query.limit ?? 50);
  const skip = parseInt(req.query.skip ?? 0);
  const timeFilter = getTimeFilter(req);
  const query = { timestamp: timeFilter };

  if (req.user?.site_uuid) query.site_uuid = req.user.site_uuid;
  if (req.user?.role === 'AGENT_VIEWER' && req.user?.agent_uuid) query.agent_uuid = req.user.agent_uuid;

  try {

    const data = await Threat.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit);
    res.json({ ok: true, data });
  } catch (error) {
    res.json({ ok: false, error: error.message });
  }
});

// GET /api/dashboard/protocols ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬  top protokol
router.get('/protocols', (req, res) => {
  const data = db.getLatestProtocols(20, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null);
  res.json({ ok: true, data });
});

// GET /api/dashboard/countries ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â top negara
router.get('/countries', (req, res) => {
  const data = db.getLatestCountries(15, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null);
  res.json({ ok: true, data });
});

// GET /api/dashboard/dns ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â top DNS queries
router.get('/dns', (req, res) => {
  const limit = parseInt(req.query.limit ?? 20);
  const data = db.getLatestDNS(limit, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null);
  res.json({ ok: true, data });
});

// GET /api/dashboard/events ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â events terbaru
router.get('/events', (req, res) => {
  const limit = parseInt(req.query.limit ?? 20);
  const rawData = db.getLatestEvents(limit, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null);

  // Normalize timestamp: "2026-06-22 08:12:28" (Netify UTC, tanpa Z) ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ "2026-06-22T08:12:28Z"
  function normalizeTimestamp(ts) {
    if (!ts) return new Date().toISOString();
    if (ts.includes('T') && (ts.endsWith('Z') || ts.includes('+'))) return ts; // already ISO
    return ts.replace(' ', 'T') + 'Z';
  }

  // Inject MAC into message like Netify does:
  // new.device   ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ "New device {mac} discovered"
  // update.device ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ "An existing device ({mac}) has been reidentified as X"
  // other types  ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ keep message as-is, MAC shown separately in column
  function buildMessage(description, event_type, mac_address) {
    if (!description) return '';
    if (!mac_address) return description;

    if (event_type === 'new.device') {
      // Replace "New device X discovered" ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ "New device {mac} discovered"
      return description.replace(/^New device .+ discovered$/, `New device ${mac_address} discovered`);
    }
    if (event_type === 'update.device') {
      // Replace "(Unknown)" or "(X)" ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ "({mac})"
      return description.replace(/\([^)]+\)/, `(${mac_address})`);
    }
    // For other types (server.discovery, encryption.audit, etc.), keep original
    return description;
  }

  const mappedData = rawData.map(r => ({
    id: r.id,
    event_id: r.event_id,
    event_type: r.event_type || 'unknown',
    severity: r.severity || 'info',
    message: buildMessage(r.description || '', r.event_type || '', r.mac_address || null),
    source_ip: r.ip_address || null,
    mac_address: r.mac_address || null,
    timestamp: normalizeTimestamp(r.event_at || r.fetched_at)
  }));
  res.json({ ok: true, data: mappedData });
});

// GET /api/dashboard/timeline ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â bandwidth timeline (grafik)
router.get('/timeline', (req, res) => {
  const points = parseInt(req.query.points ?? 60);
  const data = db.getBandwidthTimeline(points, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null);
  res.json({ ok: true, data });
});

// POST /api/dashboard/refresh ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â trigger manual poll
router.post('/refresh', async (req, res) => {
  await runPoll();
  res.json({ ok: true, message: 'Poll berhasil dijalankan.' });
});

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ ROUTES FITUR BARU 1-11 ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
router.get('/app-categories', (req, res) => {
  res.json({ ok: true, data: db.getLatest('app_categories', 'download', 15, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});
router.get('/continents', (req, res) => {
  res.json({ ok: true, data: db.getLatest('continents', 'download', 10, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});
router.get('/regions', (req, res) => {
  res.json({ ok: true, data: db.getLatest('regions', 'download', 20, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});
router.get('/cities', (req, res) => {
  res.json({ ok: true, data: db.getLatest('cities', 'download', 20, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});
router.get('/vlans', (req, res) => {
  res.json({ ok: true, data: db.getLatest('vlans', 'download', 20, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});
router.get('/interfaces', (req, res) => {
  res.json({ ok: true, data: db.getLatest('interfaces', 'download', 20, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});
router.get('/flow-types', (req, res) => {
  res.json({ ok: true, data: db.getLatest('flow_types', 'download', 10, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});
router.get('/flow-origins', (req, res) => {
  res.json({ ok: true, data: db.getLatest('flow_origins', 'download', 10, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});
router.get('/ip-versions', (req, res) => {
  res.json({ ok: true, data: db.getLatest('ip_versions', 'download', 5, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});
router.get('/remote-ips', (req, res) => {
  const limit = parseInt(req.query.limit ?? 20);
  res.json({ ok: true, data: db.getLatest('remote_ips', 'download', limit, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});
router.get('/mac-bandwidth', (req, res) => {
  const limit = parseInt(req.query.limit ?? 50);
  res.json({ ok: true, data: db.getLatest('mac_bandwidth', 'download', limit, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ FIX: ROUTES YANG SEBELUMNYA HILANG ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

// TLS Versions
router.get('/tls-versions', (req, res) => {
  res.json({ ok: true, data: db.getLatest('tls_versions', 'download', 10, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});

// TLS Ciphers
router.get('/tls-ciphers', (req, res) => {
  res.json({ ok: true, data: db.getLatest('tls_ciphers', 'download', 15, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});

// TLS Security Level
router.get('/tls-security', (req, res) => {
  res.json({ ok: true, data: db.getLatest('tls_security', 'download', 10, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});

// NetBIOS Hostnames (Windows devices)
router.get('/netbios', (req, res) => {
  const limit = parseInt(req.query.limit ?? 30);
  res.json({ ok: true, data: db.getLatest('netbios_hostnames', 'download', limit, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});

// Discovery OS (sistem operasi yang terdeteksi)
router.get('/discovery-os', (req, res) => {
  res.json({ ok: true, data: db.getLatest('discovery_os', 'download', 20, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ ROUTES DPI 12-21 ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

// 12. DHCP Class Fingerprint
router.get('/dhcp-fingerprints', (req, res) => {
  const limit = parseInt(req.query.limit ?? 30);
  res.json({ ok: true, data: db.getLatest('dhcp_fingerprints', 'download', limit, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});

// 13. HTTP User-Agent
router.get('/http-user-agents', (req, res) => {
  const limit = parseInt(req.query.limit ?? 30);
  res.json({ ok: true, data: db.getLatest('http_user_agents', 'download', limit, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});

// 14. HTTPS SNI Hostname
router.get('/sni-hostnames', (req, res) => {
  const limit = parseInt(req.query.limit ?? 30);
  res.json({ ok: true, data: db.getLatest('sni_hostnames', 'download', limit, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});

// 15. SSL Server Common Name
router.get('/ssl-server-cn', (req, res) => {
  const limit = parseInt(req.query.limit ?? 30);
  res.json({ ok: true, data: db.getLatest('ssl_server_cn', 'download', limit, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});

// 17. QUIC Hostname
router.get('/quic-hostnames', (req, res) => {
  const limit = parseInt(req.query.limit ?? 30);
  res.json({ ok: true, data: db.getLatest('quic_hostnames', 'download', limit, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});

// 18. BitTorrent Info Hash
router.get('/bittorrent-hashes', (req, res) => {
  const limit = parseInt(req.query.limit ?? 30);
  res.json({ ok: true, data: db.getLatest('bittorrent_hashes', 'download', limit, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});

// 19. SSH Version
router.get('/ssh-versions', (req, res) => {
  const limit = parseInt(req.query.limit ?? 20);
  res.json({ ok: true, data: db.getLatest('ssh_versions', 'download', limit, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});

// 21. mDNS Hostname (Chromecast, Apple TV, etc.)
router.get('/mdns-hostnames', (req, res) => {
  const limit = parseInt(req.query.limit ?? 30);
  res.json({ ok: true, data: db.getLatest('mdns_hostnames', 'download', limit, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ INTELLIGENCE ROUTES 22-30 ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

// Stats ringkasan semua intelligence (untuk badge count di tab)
router.get('/intelligence/stats', (req, res) => {
  res.json({ ok: true, data: db.getIntelStats(req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});

// 22. Cryptocurrency Mining
router.get('/intelligence/crypto-mining', (req, res) => {
  const limit = parseInt(req.query.limit ?? 50);
  res.json({ ok: true, data: db.getIntelData('intel_crypto_mining', limit, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});

// 23. Device Discovery
router.get('/intelligence/device-discovery', (req, res) => {
  const limit = parseInt(req.query.limit ?? 100);
  res.json({ ok: true, data: db.getIntelData('intel_device_discovery', limit, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});

// 24. Encryption Audit
router.get('/intelligence/encryption-audit', (req, res) => {
  const limit = parseInt(req.query.limit ?? 50);
  res.json({ ok: true, data: db.getIntelData('intel_encryption_audit', limit, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});

// 25. Insecure Protocols
router.get('/intelligence/insecure-protocols', (req, res) => {
  const limit = parseInt(req.query.limit ?? 50);
  res.json({ ok: true, data: db.getIntelData('intel_insecure_protocols', limit, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});

// 26. IP Reputation
router.get('/intelligence/ip-reputation', (req, res) => {
  const limit = parseInt(req.query.limit ?? 50);
  res.json({ ok: true, data: db.getIntelData('intel_ip_reputation', limit, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});

// 27. Server Discovery
router.get('/intelligence/server-discovery', (req, res) => {
  const limit = parseInt(req.query.limit ?? 100);
  res.json({ ok: true, data: db.getIntelData('intel_server_discovery', limit, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});

// 28. Tor Detection
router.get('/intelligence/tor', (req, res) => {
  const limit = parseInt(req.query.limit ?? 50);
  res.json({ ok: true, data: db.getIntelData('intel_tor_detection', limit, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});

// 29. Unencrypted Passwords
router.get('/intelligence/unencrypted-passwords', (req, res) => {
  const limit = parseInt(req.query.limit ?? 50);
  res.json({ ok: true, data: db.getIntelData('intel_unencrypted_passwords', limit, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});

// 30. VPN Detection
router.get('/intelligence/vpn', (req, res) => {
  const limit = parseInt(req.query.limit ?? 50);
  res.json({ ok: true, data: db.getIntelData('intel_vpn_detection', limit, req.user?.site_uuid, req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null) });
});

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ LOOKUP ROUTES ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
let cachedApplications = null;
let lastCacheTime = 0;

router.get('/lookup/applications', async (req, res) => {
  try {
    const page = parseInt(req.query.page ?? 1);
    const limit = parseInt(req.query.limit ?? 50);
    const search = String(req.query.search ?? '').toLowerCase();

    // Refresh cache every 24 hours
    if (!cachedApplications || Date.now() - lastCacheTime > 86400000) {
      const { fetchLookupApplications } = require('../netify');
      // Fetch all apps at once (Netify DB has ~2530 entries)
      const data = await fetchLookupApplications(1, 10000, '');
      if (data && data.applications && data.applications.length > 0) {
        cachedApplications = data.applications;
        lastCacheTime = Date.now();
      } else {
        return res.json({ ok: true, data: { applications: [], pagination: { total_records: 0, total_pages: 0, current_page: 1 } } });
      }
    }

    // Local Search Filtering
    let filteredApps = cachedApplications;
    if (search) {
      filteredApps = cachedApplications.filter(app =>
        (app.label && app.label.toLowerCase().includes(search)) ||
        (app.tag && app.tag.toLowerCase().includes(search)) ||
        (app.name && app.name.toLowerCase().includes(search))
      );
    }

    // Local Pagination
    const total_records = filteredApps.length;
    const total_pages = Math.ceil(total_records / limit) || 1;
    const start_idx = (page - 1) * limit;
    const paginatedApps = filteredApps.slice(start_idx, start_idx + limit);

    res.json({
      ok: true,
      data: {
        applications: paginatedApps,
        pagination: {
          total_records,
          total_pages,
          current_page: page,
          limit
        }
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ INTERACTIVE DETAIL ROUTES Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

// GET /api/dashboard/agent-details?uuid=2F-TF-1D-GK
router.get('/agent-details', async (req, res) => {
  try {
    const uuid = String(req.query.uuid ?? '');
    if (!uuid) return res.status(400).json({ ok: false, message: 'uuid required' });
    const { fetchAgentDetails } = require('../netify');
    const data = await fetchAgentDetails(uuid);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/dashboard/device-details?ip=10.6.10.23
router.get('/device-details', async (req, res) => {
  try {
    const ip = String(req.query.ip ?? '');
    if (!ip) return res.status(400).json({ ok: false, message: 'ip required' });
    const timeFilter = getTimeFilter(req);
    
    // Fetch device basic info
    const device = await DeviceStat.findOne({ timestamp: timeFilter, ip_address: ip }).sort({ timestamp: -1 });
    
    const flows = await Flow.find({ timestamp: timeFilter, $or: [{src_ip: ip}, {dst_ip: ip}] }).sort({ timestamp: -1 }).limit(500);
    const threats = await Threat.find({ timestamp: timeFilter, $or: [{src_ip: ip}, {dst_ip: ip}] }).sort({ timestamp: -1 }).limit(100);
    
    const appsMap = {};
    const protocolsMap = {};
    const domainsMap = {};
    const destinationsMap = {};
    
    flows.forEach(f => {
      // Determine if traffic is outbound (IP is source) or inbound
      const isSrc = f.src_ip === ip;
      // Netify flow directionality is relative to the internal network. We'll use the flow's download/upload values.
      const down = f.download || 0;
      const up = f.upload || 0;
      
      const updateTimestamps = (mapObj) => {
        if (f.first_seen) {
          if (!mapObj.first_seen || new Date(f.first_seen) < new Date(mapObj.first_seen)) {
            mapObj.first_seen = f.first_seen;
          }
        }
        if (f.last_seen) {
          if (!mapObj.last_seen || new Date(f.last_seen) > new Date(mapObj.last_seen)) {
            mapObj.last_seen = f.last_seen;
          }
        }
      };
      
      // 1. Applications & Protocols
      if (f.app_label) {
        if (f.app_label.startsWith('Port ')) {
          const protoKey = f.app_label;
          if (!protocolsMap[protoKey]) protocolsMap[protoKey] = { app_label: protoKey, download: 0, upload: 0 };
          protocolsMap[protoKey].download += down;
          protocolsMap[protoKey].upload += up;
          updateTimestamps(protocolsMap[protoKey]);
        } else {
          const appKey = f.app_label;
          if (!appsMap[appKey]) appsMap[appKey] = { app_label: appKey, download: 0, upload: 0 };
          appsMap[appKey].download += down;
          appsMap[appKey].upload += up;
          updateTimestamps(appsMap[appKey]);
        }
      } else if (f.protocol) {
        const protoKey = f.protocol;
        if (!protocolsMap[protoKey]) protocolsMap[protoKey] = { app_label: protoKey, download: 0, upload: 0 };
        protocolsMap[protoKey].download += down;
        protocolsMap[protoKey].upload += up;
        updateTimestamps(protocolsMap[protoKey]);
      }
      
      // 2. Domains
      if (f.domain) {
        const domainKey = f.domain;
        if (!domainsMap[domainKey]) domainsMap[domainKey] = { app_label: domainKey, download: 0, upload: 0 };
        domainsMap[domainKey].download += down;
        domainsMap[domainKey].upload += up;
        updateTimestamps(domainsMap[domainKey]);
      }
      
      // 3. Destinations
      const dstIp = isSrc ? f.dst_ip : f.src_ip; // The other party
      if (dstIp) {
        if (!destinationsMap[dstIp]) destinationsMap[dstIp] = { app_label: dstIp, download: 0, upload: 0 };
        destinationsMap[dstIp].download += down;
        destinationsMap[dstIp].upload += up;
        updateTimestamps(destinationsMap[dstIp]);
      }
    });
    
    const totalDownload = device?.download || 0;
    const totalUpload = device?.upload || 0;
    
    res.json({ 
      ok: true, 
      data: {
        ip_address: ip,
        mac_address: device?.mac_address || null,
        device_label: device?.device_label || null,
        device_type: device?.device_type || null,
        os_label: device?.os_label || null,
        manufacturer: device?.manufacturer || null,
        last_seen: device?.last_seen || null,
        total_download: totalDownload,
        total_upload: totalUpload,
        flows: flows,
        apps: Object.values(appsMap).sort((a,b) => b.download - a.download),
        protocols: Object.values(protocolsMap).sort((a,b) => b.download - a.download),
        domains: Object.values(domainsMap).sort((a,b) => b.download - a.download),
        destinations: Object.values(destinationsMap).sort((a,b) => b.download - a.download).slice(0, 10),
        threats: threats
      } 
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/dashboard/app-details?label=YouTube
router.get('/app-details', async (req, res) => {
  try {
    const label = String(req.query.label ?? '');
    if (!label) return res.status(400).json({ ok: false, message: 'label required' });
    const timeFilter = getTimeFilter(req);
    
    const devices = await DeviceStat.find({
      timestamp: timeFilter,
      app_labels: label
    }).sort({ download: -1 }).limit(100);
    
    const appStats = await AppStat.find({
      timestamp: timeFilter,
      app_label: label
    });
    
    let totalDownload = 0;
    let totalUpload = 0;
    appStats.forEach(a => {
      totalDownload += (a.download || 0);
      totalUpload += (a.upload || 0);
    });
    
    res.json({ 
      ok: true, 
      data: {
        label,
        total_download: totalDownload,
        total_upload: totalUpload,
        devices: devices
      } 
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/dashboard/security-devices
router.get('/security-devices', async (req, res) => {
  try {
    const { fetchSecurityDevices } = require('../netify');
    const siteUuid = req.user?.site_uuid || null;
    const agentUuid = req.user?.role === 'AGENT_VIEWER' ? req.user?.agent_uuid : null;
    const data = await fetchSecurityDevices(siteUuid, agentUuid);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/dashboard/data-interval
router.get('/data-interval', (req, res) => {
  try {
    // Return empty array since we removed db.getDataInterval
    res.json({ ok: true, data: [] });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;

