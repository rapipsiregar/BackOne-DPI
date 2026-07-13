// backend/routes/metadataDetail.js
// ─────────────────────────────────────────────────────────────────────────────
// Row-level detail endpoints for the BackOne Metadata page.
// Each endpoint returns the real MongoDB breakdown for a clicked row.
// GET /api/dashboard/metadata-detail?type=<type>&value=<value>
//
// Supported types:
//   sni_hostname, ssl_server_cn, quic_hostname  → Flow collection (domain field)
//   netbios_hostname, os_label                 → DeviceStat collection
//   dhcp_fingerprint                           → DhcpFingerprintStat collection
//   http_useragent                             → HttpUserAgentStat collection
//   ssh_version                               → SshClientStat + SshServerStat
//   bittorrent_hash                           → BittorrentHashStat collection
//   mdns_hostname                             → MdnsHostnameStat collection
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();

const { Flow, DeviceStat } = require('../models/Schemas');
const {
  DhcpFingerprintStat, HttpUserAgentStat, BittorrentHashStat,
  SniHostnameStat, SslServerCnStat, QuicHostnameStat,
  SshClientStat, SshServerStat, MdnsHostnameStat,
} = require('../models/SchemasTelemetry');

// ─── Helper: build base filter from request user/time ──────────────────────────
function buildBaseFilter(req) {
  const range = req.query.timeRange || 'all';
  const filter = {};
  if (req.user?.site_uuid) filter.site_uuid = req.user.site_uuid;
  if (req.user?.role === 'AGENT_VIEWER' && req.user?.agent_uuid) {
    filter.agent_uuid = req.user.agent_uuid;
  }
  if (range !== 'all') {
    const ms = { '5m': 300000, '30m': 1800000, '1h': 3600000, '1d': 86400000, '7d': 604800000 };
    const delta = ms[range];
    if (delta) filter.timestamp = { $gte: new Date(Date.now() - delta) };
  }
  return filter;
}

// ─── Helper: get per-device breakdown from Flow using a domain value ────────────
async function deviceBreakdownByDomain(type, value, base) {
  let matchQuery = { ...base };
  
  if (type === 'sni_hostname') {
    // Exact match for sni_hostname, with a fallback OR condition 
    // just in case old data doesn't have sni_hostname but domain matches it closely
    const parts = value.split('.');
    const baseDomain = parts.length > 2 ? parts.slice(-2).join('.') : value;
    const baseDomain2 = parts.length > 3 ? parts.slice(-3).join('.') : value; // For co.uk etc
    
    matchQuery.$or = [
      { sni_hostname: value },
      { domain: value },
      { domain: baseDomain },
      { domain: baseDomain2 }
    ];
  } else {
    matchQuery.domain = value;
  }

  return Flow.aggregate([
    { $match: matchQuery },
    { $group: {
        _id:        '$src_ip',
        download:   { $sum: '$download' },
        upload:     { $sum: '$upload' },
        flows:      { $sum: 1 },
        agent_uuid: { $first: '$agent_uuid' },
        last_seen:  { $max: '$timestamp' },
    }},
    { $sort: { download: -1 } },
    { $limit: 200 },
  ]);
}

// ─── Helper: enrich IP rows with DeviceStat info ───────────────────────────────
async function enrichWithDeviceStat(ipRows, agentFilter) {
  const { generateMacFromIp, resolveVendorFromIp, resolveOSFromIp, generateAutoLabel } = require('../deviceResolver');
  const ips = ipRows.map(r => r._id).filter(Boolean);
  const devices = await DeviceStat.find({ ip_address: { $in: ips }, ...agentFilter }).lean();
  const deviceMap = {};
  for (const d of devices) deviceMap[d.ip_address] = d;
  return ipRows.map(r => {
    const ip = r._id;
    const d = deviceMap[ip];
    const mac = d?.mac_address && d.mac_address !== '-' ? d.mac_address : generateMacFromIp(ip);
    const manufacturer = d?.manufacturer && d.manufacturer !== '-' && d.manufacturer !== 'Unknown' ? d.manufacturer : resolveVendorFromIp(ip);
    const os = d?.os_label && d.os_label !== '-' && d.os_label !== 'Unknown' ? d.os_label : resolveOSFromIp(ip);
    const label = d?.device_label && d.device_label !== '-' && d.device_label !== ip ? d.device_label : generateAutoLabel(ip, mac, manufacturer, 'Workstation');
    return {
      src_ip:       ip,
      device_label: label,
      mac_address:  mac,
      manufacturer: manufacturer,
      os_label:     os,
      download:     r.download,
      upload:       r.upload,
      flows:        r.flows,
      agent_uuid:   r.agent_uuid,
      last_seen:    r.last_seen,
    };
  });
}

// ─── GET /api/dashboard/metadata-detail ───────────────────────────────────────
router.get('/', async (req, res) => {
  const { type, value } = req.query;
  if (!type || !value) return res.status(400).json({ ok: false, error: 'type and value are required' });

  const base = buildBaseFilter(req);
  const agentFilter = {};
  if (base.agent_uuid) agentFilter.agent_uuid = base.agent_uuid;
  if (base.site_uuid)  agentFilter.site_uuid  = base.site_uuid;

  try {
    let data = [];

    // ── Domain-based types: cross-reference with Flow.domain ──────────────────
    if (['sni_hostname', 'ssl_server_cn', 'quic_hostname'].includes(type)) {
      const ipRows = await deviceBreakdownByDomain(type, value, base);
      data = await enrichWithDeviceStat(ipRows, agentFilter);
    }

    // ── NetBIOS / OS: query DeviceStat directly ────────────────────────────────
    else if (type === 'netbios_hostname') {
      const pipeline = [
        { $match: { device_label: value, ...agentFilter } },
        { $sort:  { timestamp: -1 } },
        { $group: {
            _id:          '$ip_address',
            mac_address:  { $first: '$mac_address' },
            device_label: { $first: '$device_label' },
            device_type:  { $first: '$device_type' },
            os_label:     { $first: '$os_label' },
            manufacturer: { $first: '$manufacturer' },
            download:     { $max:   '$download' },
            upload:       { $max:   '$upload' },
            agent_uuid:   { $first: '$agent_uuid' },
            last_seen:    { $first: '$last_seen' },
        }},
        { $sort: { download: -1 } },
      ];
      const rows = await DeviceStat.aggregate(pipeline);
      data = rows.map(d => ({
        ip_address:   d._id,
        mac_address:  d.mac_address  || '—',
        device_label: d.device_label || '—',
        device_type:  d.device_type  || '—',
        os_label:     d.os_label     || '—',
        manufacturer: d.manufacturer || '—',
        download:     d.download     || 0,
        upload:       d.upload       || 0,
        agent_uuid:   d.agent_uuid,
        last_seen:    d.last_seen,
      }));
    }

    else if (type === 'os_label') {
      const pipeline = [
        { $match: { os_label: value, ...agentFilter } },
        { $sort:  { timestamp: -1 } },
        { $group: {
            _id:          '$ip_address',
            mac_address:  { $first: '$mac_address' },
            device_label: { $first: '$device_label' },
            device_type:  { $first: '$device_type' },
            manufacturer: { $first: '$manufacturer' },
            download:     { $max:   '$download' },
            upload:       { $max:   '$upload' },
            agent_uuid:   { $first: '$agent_uuid' },
            last_seen:    { $first: '$last_seen' },
        }},
        { $sort: { download: -1 } },
      ];
      const rows = await DeviceStat.aggregate(pipeline);
      data = rows.map(d => ({
        ip_address:   d._id,
        mac_address:  d.mac_address  || '—',
        device_label: d.device_label || d._id,
        device_type:  d.device_type  || '—',
        manufacturer: d.manufacturer || '—',
        download:     d.download     || 0,
        upload:       d.upload       || 0,
        agent_uuid:   d.agent_uuid,
        last_seen:    d.last_seen,
      }));
    }

    // ── Property-based types: query specific telemetry collection ──────────────
    else if (type === 'dhcp_fingerprint') {
      data = await DhcpFingerprintStat.find({ fingerprint: value, ...agentFilter })
        .sort({ download: -1 }).limit(200).lean();
    }

    else if (type === 'http_useragent') {
      data = await HttpUserAgentStat.find({ user_agent: value, ...agentFilter })
        .sort({ download: -1 }).limit(200).lean();
    }

    else if (type === 'bittorrent_hash') {
      data = await BittorrentHashStat.find({ info_hash: value, ...agentFilter })
        .sort({ download: -1 }).limit(200).lean();
    }

    else if (type === 'ssh_version') {
      const [clients, servers] = await Promise.all([
        SshClientStat.find({ ssh_client: value, ...agentFilter }).sort({ download: -1 }).limit(200).lean(),
        SshServerStat.find({ ssh_server: value, ...agentFilter }).sort({ download: -1 }).limit(200).lean(),
      ]);
      // Merge clients + servers, label each with role
      data = [
        ...clients.map(r => ({ ...r, role: 'Client' })),
        ...servers.map(r => ({ ...r, role: 'Server' })),
      ].sort((a, b) => (b.download || 0) - (a.download || 0));
    }

    else if (type === 'mdns_hostname') {
      data = await MdnsHostnameStat.find({ mdns_hostname: value, ...agentFilter })
        .sort({ download: -1 }).limit(200).lean();
    }

    else {
      return res.status(400).json({ ok: false, error: `Unknown detail type: ${type}` });
    }

    res.json({ ok: true, type, value, count: data.length, data });
  } catch (err) {
    console.error('[MetadataDetail] Error:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
