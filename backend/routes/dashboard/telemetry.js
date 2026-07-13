const express = require('express');
const router  = express.Router();
const {
  DeviceStat, DhcpFingerprintStat, HttpUserAgentStat,
  SniHostnameStat, SslServerCnStat, QuicHostnameStat,
  BittorrentHashStat, SshClientStat, SshServerStat, MdnsHostnameStat,
  Flow
} = require('../../models/Schemas');
const { getTimeFilter, getBaseFilter } = require('./helpers');

// GET /api/dashboard/netbios
router.get('/netbios', async (req, res) => {
  try {
    const limit      = parseInt(req.query.limit ?? 30);
    const timeFilter = getTimeFilter(req);
    const matchBase  = getBaseFilter(req, timeFilter);

    const raw = await DeviceStat.aggregate([
      { $match: matchBase },
      { $group: { _id: { $ifNull: ['$device_label', '$ip_address'] }, download: { $sum: '$download' }, upload: { $sum: '$upload' } } }
    ]);
    const data = raw.map((r, index) => {
      const hostname = r._id && r._id !== '-' ? r._id : `LAN-Host-${index + 1}`;
      return {
        hostname,
        total: r.download + r.upload
      };
    }).sort((a, b) => b.total - a.total).slice(0, limit);

    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/discovery-os
router.get('/discovery-os', async (req, res) => {
  try {
    const timeFilter = getTimeFilter(req);
    const matchBase  = getBaseFilter(req, timeFilter);

    const raw = await DeviceStat.aggregate([
      { $match: matchBase },
      {
        $group: {
          _id:      '$os_label',
          download: { $sum: '$download' },
          upload:   { $sum: '$upload' },
        }
      },
      { $match: { _id: { $ne: null, $ne: '' } } },
    ]);

    const data = raw.map(r => ({
      os_label: r._id,
      download: r.download,
      upload:   r.upload,
      total:    r.download + r.upload
    })).sort((a, b) => b.total - a.total);

    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/dhcp-fingerprints
router.get('/dhcp-fingerprints', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit ?? 30);
    const timeFilter = getTimeFilter(req);
    const matchBase = getBaseFilter(req, timeFilter);

    const raw = await DhcpFingerprintStat.aggregate([
      { $match: matchBase },
      { $group: {
          _id:         '$fingerprint',
          download:    { $sum: '$download' },
          upload:      { $sum: '$upload' },
          flows:       { $sum: '$flows' }
      }},
      { $project: { fingerprint: '$_id', total: { $add: ['$download', '$upload'] }, download: 1, upload: 1, flows: 1, _id: 0 } },
      { $sort: { total: -1 } },
      { $limit: limit }
    ]);
    res.json({ ok: true, data: raw });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/http-user-agents
router.get('/http-user-agents', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit ?? 30);
    const timeFilter = getTimeFilter(req);
    const matchBase = getBaseFilter(req, timeFilter);

    const raw = await HttpUserAgentStat.aggregate([
      { $match: matchBase },
      { $group: {
          _id:         '$user_agent',
          download:    { $sum: '$download' },
          upload:      { $sum: '$upload' },
          flows:       { $sum: '$flows' }
      }},
      { $project: { user_agent: '$_id', total: { $add: ['$download', '$upload'] }, download: 1, upload: 1, flows: 1, _id: 0 } },
      { $sort: { total: -1 } },
      { $limit: limit }
    ]);
    res.json({ ok: true, data: raw });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/sni-hostnames
router.get('/sni-hostnames', async (req, res) => {
  try {
    const limit       = parseInt(req.query.limit ?? 50);
    const timeFilter  = getTimeFilter(req);
    const matchBase   = getBaseFilter(req, timeFilter);

    let raw = await SniHostnameStat.aggregate([
      { $match: matchBase },
      { $group: { _id: '$sni_hostname', download: { $sum: '$download' }, upload: { $sum: '$upload' }, flows: { $sum: '$flows' } } },
      { $project: { sni_hostname: '$_id', total: { $add: ['$download', '$upload'] }, download: 1, upload: 1, flows: 1, _id: 0 } },
      { $sort: { total: -1 } },
      
    ]);

    if (raw.length === 0) {
      const SYSTEM_DOMAINS = ['agents.backone.ai', 'agents.backonedpi.ai'];
      const flowBase = { ...matchBase, domain: { $exists: true, $ne: null, $ne: '', $nin: SYSTEM_DOMAINS } };
      raw = await Flow.aggregate([
        { $match: flowBase },
        { $group: { _id: '$domain', download: { $sum: '$download' }, upload: { $sum: '$upload' }, flows: { $sum: 1 } } },
        { $project: { sni_hostname: '$_id', total: { $add: ['$download', '$upload'] }, download: 1, upload: 1, flows: 1, _id: 0 } },
        { $sort: { total: -1 } },
        
      ]);
      raw = raw.filter(r => r.sni_hostname && !String(r.sni_hostname).startsWith('Port '));
    }

    res.json({ ok: true, data: raw });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/ssl-server-cn
router.get('/ssl-server-cn', async (req, res) => {
  try {
    const limit       = parseInt(req.query.limit ?? 50);
    const timeFilter  = getTimeFilter(req);
    const matchBase   = getBaseFilter(req, timeFilter);

    let raw = await SslServerCnStat.aggregate([
      { $match: matchBase },
      { $group: { _id: '$ssl_server_cn', download: { $sum: '$download' }, upload: { $sum: '$upload' }, flows: { $sum: '$flows' } } },
      { $project: { ssl_server_cn: '$_id', total: { $add: ['$download', '$upload'] }, download: 1, upload: 1, flows: 1, _id: 0 } },
      { $sort: { total: -1 } },
      
    ]);

    if (raw.length === 0) {
      const SYSTEM_DOMAINS = ['agents.backone.ai', 'agents.backonedpi.ai'];
      const flowBase = { ...matchBase, domain: { $exists: true, $ne: null, $ne: '', $nin: SYSTEM_DOMAINS } };
      const flowRaw = await Flow.aggregate([
        { $match: flowBase },
        { $group: { _id: '$domain', download: { $sum: '$download' }, upload: { $sum: '$upload' }, flows: { $sum: 1 } } },
        { $project: { ssl_server_cn: '$_id', total: { $add: ['$download', '$upload'] }, download: 1, upload: 1, flows: 1, _id: 0 } },
        { $sort: { total: -1 } },
        
      ]);
      raw = flowRaw.filter(r => r.ssl_server_cn && !String(r.ssl_server_cn).startsWith('Port '));
    }

    res.json({ ok: true, data: raw });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/quic-hostnames
router.get('/quic-hostnames', async (req, res) => {
  try {
    const limit       = parseInt(req.query.limit ?? 50);
    const timeFilter  = getTimeFilter(req);
    const matchBase   = getBaseFilter(req, timeFilter);

    let raw = await QuicHostnameStat.aggregate([
      { $match: matchBase },
      { $group: { _id: '$quic_hostname', download: { $sum: '$download' }, upload: { $sum: '$upload' }, flows: { $sum: '$flows' } } },
      { $project: { quic_hostname: '$_id', total: { $add: ['$download', '$upload'] }, download: 1, upload: 1, flows: 1, _id: 0 } },
      { $sort: { total: -1 } },
      
    ]);

    if (raw.length === 0) {
      const SYSTEM_DOMAINS = ['agents.backone.ai', 'agents.backonedpi.ai'];
      const flowBase = { ...matchBase, domain: { $exists: true, $ne: null, $ne: '', $nin: SYSTEM_DOMAINS } };
      const flowRaw = await Flow.aggregate([
        { $match: flowBase },
        { $group: { _id: '$domain', download: { $sum: '$download' }, upload: { $sum: '$upload' }, flows: { $sum: 1 } } },
        { $project: { quic_hostname: '$_id', total: { $add: ['$download', '$upload'] }, download: 1, upload: 1, flows: 1, _id: 0 } },
        { $sort: { total: -1 } },
        
      ]);
      raw = flowRaw.filter(r => r.quic_hostname && !String(r.quic_hostname).startsWith('Port '));
    }

    res.json({ ok: true, data: raw });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/bittorrent-hashes
router.get('/bittorrent-hashes', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit ?? 30);
    const timeFilter = getTimeFilter(req);
    const matchBase = getBaseFilter(req, timeFilter);

    const raw = await BittorrentHashStat.aggregate([
      { $match: matchBase },
      { $group: {
          _id:         '$info_hash',
          label:       { $first: '$label' },
          download:    { $sum: '$download' },
          upload:      { $sum: '$upload' },
          flows:       { $sum: '$flows' }
      }},
      { $project: { info_hash: '$_id', label: 1, total: { $add: ['$download', '$upload'] }, download: 1, upload: 1, flows: 1, _id: 0 } },
      { $sort: { total: -1 } },
      { $limit: limit }
    ]);
    res.json({ ok: true, data: raw });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/ssh-versions
router.get('/ssh-versions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit ?? 20);
    const timeFilter = getTimeFilter(req);
    const matchBase = getBaseFilter(req, timeFilter);

    const [clients, servers] = await Promise.all([
      SshClientStat.aggregate([
        { $match: matchBase },
        { $group: { _id: '$ssh_client', download: { $sum: '$download' }, upload: { $sum: '$upload' }, flows: { $sum: '$flows' } } },
        { $project: { ssh_version: '$_id', total: { $add: ['$download', '$upload'] }, download: 1, upload: 1, flows: 1, _id: 0 } },
        { $sort: { total: -1 } },
        
      ]),
      SshServerStat.aggregate([
        { $match: matchBase },
        { $group: { _id: '$ssh_server', download: { $sum: '$download' }, upload: { $sum: '$upload' }, flows: { $sum: '$flows' } } },
        { $project: { ssh_version: '$_id', total: { $add: ['$download', '$upload'] }, download: 1, upload: 1, flows: 1, _id: 0 } },
        { $sort: { total: -1 } },
        
      ]),
    ]);

    const merged = {};
    for (const r of [...clients, ...servers]) {
      if (!merged[r.ssh_version]) merged[r.ssh_version] = { ...r };
      else {
        merged[r.ssh_version].download += r.download;
        merged[r.ssh_version].upload   += r.upload;
        merged[r.ssh_version].total    += r.total;
        merged[r.ssh_version].flows    += r.flows;
      }
    }
    const data = Object.values(merged).sort((a, b) => b.total - a.total).slice(0, limit);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/mdns-hostnames
router.get('/mdns-hostnames', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit ?? 30);
    const timeFilter = getTimeFilter(req);
    const matchBase = getBaseFilter(req, timeFilter);
    const raw = await MdnsHostnameStat.aggregate([
      { $match: matchBase },
      { $group: { _id: '$mdns_hostname', download: { $sum: '$download' }, upload: { $sum: '$upload' }, flows: { $sum: '$flows' } } },
      { $project: { mdns_hostname: '$_id', total: { $add: ['$download', '$upload'] }, download: 1, upload: 1, flows: 1, _id: 0 } },
      { $sort: { total: -1 } },
      
    ]);
    res.json({ ok: true, data: raw });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
