// backend/routes/dashboard.js
const express = require('express');
const router  = express.Router();
const db      = require('../database');
const { runPoll } = require('../scheduler');

// GET /api/dashboard/summary — kartu ringkasan (top of page)
router.get('/summary', (req, res) => {
  const stats    = db.getStats();
  const timeline = db.getBandwidthTimeline(1);
  const latest   = timeline[0] ?? {};

  res.json({
    ok: true,
    data: {
      total_devices  : stats.totalDevices,
      total_threats  : stats.totalThreats,
      total_events   : stats.totalEvents,
      last_fetch     : stats.lastFetch,
      bandwidth_down : latest.total_download ?? 0,
      bandwidth_up   : latest.total_upload   ?? 0,
      active_flows   : stats.activeFlows,
    }
  });
});

// GET /api/dashboard/apps — top aplikasi
router.get('/apps', (req, res) => {
  const limit = parseInt(req.query.limit ?? 10);
  const data  = db.getLatestBandwidthApps(limit);
  res.json({ ok: true, data });
});

// GET /api/dashboard/devices — daftar device
router.get('/devices', (req, res) => {
  const limit = parseInt(req.query.limit ?? 50);
  const data  = db.getLatestDevices(limit);
  res.json({ ok: true, data });
});

// GET /api/dashboard/flows — flow aktif
router.get('/flows', (req, res) => {
  const limit = parseInt(req.query.limit ?? 50);
  const data  = db.getLatestFlows(limit);
  res.json({ ok: true, data });
});

// GET /api/dashboard/threats — ancaman keamanan
router.get('/threats', (req, res) => {
  const limit = parseInt(req.query.limit ?? 20);
  const data  = db.getLatestThreats(limit);
  res.json({ ok: true, data });
});

// GET /api/dashboard/protocols — top protokol
router.get('/protocols', (req, res) => {
  const data = db.getLatestProtocols();
  res.json({ ok: true, data });
});

// GET /api/dashboard/countries — top negara
router.get('/countries', (req, res) => {
  const data = db.getLatestCountries();
  res.json({ ok: true, data });
});

// GET /api/dashboard/dns — top DNS queries
router.get('/dns', (req, res) => {
  const limit = parseInt(req.query.limit ?? 20);
  const data  = db.getLatestDNS(limit);
  res.json({ ok: true, data });
});

// GET /api/dashboard/events — events terbaru
router.get('/events', (req, res) => {
  const limit = parseInt(req.query.limit ?? 20);
  const rawData  = db.getLatestEvents(limit);
  const mappedData = rawData.map(r => ({
    id: r.id,
    event_id: r.event_id,
    event_type: r.event_type || 'unknown',
    severity: r.severity || 'info',
    message: r.description || '',
    source_ip: r.ip_address || null,
    timestamp: r.event_at || r.fetched_at || new Date().toISOString()
  }));
  res.json({ ok: true, data: mappedData });
});

// GET /api/dashboard/timeline — bandwidth timeline (grafik)
router.get('/timeline', (req, res) => {
  const points = parseInt(req.query.points ?? 60);
  const data   = db.getBandwidthTimeline(points);
  res.json({ ok: true, data });
});

// POST /api/dashboard/refresh — trigger manual poll
router.post('/refresh', async (req, res) => {
  await runPoll();
  res.json({ ok: true, message: 'Poll berhasil dijalankan.' });
});

// ─── ROUTES FITUR BARU 1-11 ───────────────────────────────────────────────────
router.get('/app-categories', (req, res) => {
  res.json({ ok: true, data: db.getLatest('app_categories', 'download', 15) });
});
router.get('/continents', (req, res) => {
  res.json({ ok: true, data: db.getLatest('continents', 'download', 10) });
});
router.get('/regions', (req, res) => {
  res.json({ ok: true, data: db.getLatest('regions', 'download', 20) });
});
router.get('/cities', (req, res) => {
  res.json({ ok: true, data: db.getLatest('cities', 'download', 20) });
});
router.get('/vlans', (req, res) => {
  res.json({ ok: true, data: db.getLatest('vlans', 'download', 20) });
});
router.get('/interfaces', (req, res) => {
  res.json({ ok: true, data: db.getLatest('interfaces', 'download', 20) });
});
router.get('/flow-types', (req, res) => {
  res.json({ ok: true, data: db.getLatest('flow_types', 'download', 10) });
});
router.get('/flow-origins', (req, res) => {
  res.json({ ok: true, data: db.getLatest('flow_origins', 'download', 10) });
});
router.get('/ip-versions', (req, res) => {
  res.json({ ok: true, data: db.getLatest('ip_versions', 'download', 5) });
});
router.get('/remote-ips', (req, res) => {
  const limit = parseInt(req.query.limit ?? 20);
  res.json({ ok: true, data: db.getLatest('remote_ips', 'download', limit) });
});
router.get('/mac-bandwidth', (req, res) => {
  const limit = parseInt(req.query.limit ?? 50);
  res.json({ ok: true, data: db.getLatest('mac_bandwidth', 'download', limit) });
});

// ─── FIX: ROUTES YANG SEBELUMNYA HILANG ──────────────────────────────────────

// TLS Versions
router.get('/tls-versions', (req, res) => {
  res.json({ ok: true, data: db.getLatest('tls_versions', 'download', 10) });
});

// TLS Ciphers
router.get('/tls-ciphers', (req, res) => {
  res.json({ ok: true, data: db.getLatest('tls_ciphers', 'download', 15) });
});

// TLS Security Level
router.get('/tls-security', (req, res) => {
  res.json({ ok: true, data: db.getLatest('tls_security', 'download', 10) });
});

// NetBIOS Hostnames (Windows devices)
router.get('/netbios', (req, res) => {
  const limit = parseInt(req.query.limit ?? 30);
  res.json({ ok: true, data: db.getLatest('netbios_hostnames', 'download', limit) });
});

// Discovery OS (sistem operasi yang terdeteksi)
router.get('/discovery-os', (req, res) => {
  res.json({ ok: true, data: db.getLatest('discovery_os', 'download', 20) });
});

// ─── ROUTES DPI 12-21 ─────────────────────────────────────────────────────────

// 12. DHCP Class Fingerprint
router.get('/dhcp-fingerprints', (req, res) => {
  const limit = parseInt(req.query.limit ?? 30);
  res.json({ ok: true, data: db.getLatest('dhcp_fingerprints', 'download', limit) });
});

// 13. HTTP User-Agent
router.get('/http-user-agents', (req, res) => {
  const limit = parseInt(req.query.limit ?? 30);
  res.json({ ok: true, data: db.getLatest('http_user_agents', 'download', limit) });
});

// 14. HTTPS SNI Hostname
router.get('/sni-hostnames', (req, res) => {
  const limit = parseInt(req.query.limit ?? 30);
  res.json({ ok: true, data: db.getLatest('sni_hostnames', 'download', limit) });
});

// 15. SSL Server Common Name
router.get('/ssl-server-cn', (req, res) => {
  const limit = parseInt(req.query.limit ?? 30);
  res.json({ ok: true, data: db.getLatest('ssl_server_cn', 'download', limit) });
});

// 17. QUIC Hostname
router.get('/quic-hostnames', (req, res) => {
  const limit = parseInt(req.query.limit ?? 30);
  res.json({ ok: true, data: db.getLatest('quic_hostnames', 'download', limit) });
});

// 18. BitTorrent Info Hash
router.get('/bittorrent-hashes', (req, res) => {
  const limit = parseInt(req.query.limit ?? 30);
  res.json({ ok: true, data: db.getLatest('bittorrent_hashes', 'download', limit) });
});

// 19. SSH Version
router.get('/ssh-versions', (req, res) => {
  const limit = parseInt(req.query.limit ?? 20);
  res.json({ ok: true, data: db.getLatest('ssh_versions', 'download', limit) });
});

// 21. mDNS Hostname (Chromecast, Apple TV, etc.)
router.get('/mdns-hostnames', (req, res) => {
  const limit = parseInt(req.query.limit ?? 30);
  res.json({ ok: true, data: db.getLatest('mdns_hostnames', 'download', limit) });
});

// ─── INTELLIGENCE ROUTES 22-30 ────────────────────────────────────────────────

// Stats ringkasan semua intelligence (untuk badge count di tab)
router.get('/intelligence/stats', (req, res) => {
  res.json({ ok: true, data: db.getIntelStats() });
});

// 22. Cryptocurrency Mining
router.get('/intelligence/crypto-mining', (req, res) => {
  const limit = parseInt(req.query.limit ?? 50);
  res.json({ ok: true, data: db.getIntelData('intel_crypto_mining', limit) });
});

// 23. Device Discovery
router.get('/intelligence/device-discovery', (req, res) => {
  const limit = parseInt(req.query.limit ?? 100);
  res.json({ ok: true, data: db.getIntelData('intel_device_discovery', limit) });
});

// 24. Encryption Audit
router.get('/intelligence/encryption-audit', (req, res) => {
  const limit = parseInt(req.query.limit ?? 50);
  res.json({ ok: true, data: db.getIntelData('intel_encryption_audit', limit) });
});

// 25. Insecure Protocols
router.get('/intelligence/insecure-protocols', (req, res) => {
  const limit = parseInt(req.query.limit ?? 50);
  res.json({ ok: true, data: db.getIntelData('intel_insecure_protocols', limit) });
});

// 26. IP Reputation
router.get('/intelligence/ip-reputation', (req, res) => {
  const limit = parseInt(req.query.limit ?? 50);
  res.json({ ok: true, data: db.getIntelData('intel_ip_reputation', limit) });
});

// 27. Server Discovery
router.get('/intelligence/server-discovery', (req, res) => {
  const limit = parseInt(req.query.limit ?? 100);
  res.json({ ok: true, data: db.getIntelData('intel_server_discovery', limit) });
});

// 28. Tor Detection
router.get('/intelligence/tor', (req, res) => {
  const limit = parseInt(req.query.limit ?? 50);
  res.json({ ok: true, data: db.getIntelData('intel_tor_detection', limit) });
});

// 29. Unencrypted Passwords
router.get('/intelligence/unencrypted-passwords', (req, res) => {
  const limit = parseInt(req.query.limit ?? 50);
  res.json({ ok: true, data: db.getIntelData('intel_unencrypted_passwords', limit) });
});

// 30. VPN Detection
router.get('/intelligence/vpn', (req, res) => {
  const limit = parseInt(req.query.limit ?? 50);
  res.json({ ok: true, data: db.getIntelData('intel_vpn_detection', limit) });
});

// ─── LOOKUP ROUTES ────────────────────────────────────────────────────────────
router.get('/lookup/applications', async (req, res) => {
  try {
    const page   = parseInt(req.query.page ?? 1);
    const limit  = parseInt(req.query.limit ?? 50);
    const search = String(req.query.search ?? '');
    const { fetchLookupApplications } = require('../netify');
    const data = await fetchLookupApplications(page, limit, search);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ─── INTERACTIVE DETAIL ROUTES ───────────────────────────────────────────────

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
    const { fetchDeviceDetails } = require('../netify');
    const data = await fetchDeviceDetails(ip);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/dashboard/app-details?label=YouTube
router.get('/app-details', async (req, res) => {
  try {
    const label = String(req.query.label ?? '');
    if (!label) return res.status(400).json({ ok: false, message: 'label required' });
    const { fetchAppDetails } = require('../netify');
    const data = await fetchAppDetails(label);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/dashboard/security-devices
router.get('/security-devices', async (req, res) => {
  try {
    const { fetchSecurityDevices } = require('../netify');
    const data = await fetchSecurityDevices();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;