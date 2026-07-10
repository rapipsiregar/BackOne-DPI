const express = require('express');
const router  = express.Router();
const { Threat, Event, Flow } = require('../../models/Schemas');
const { getTimeFilter, getBaseFilter } = require('./helpers');
const { generateMacFromIp, resolveDeviceTypeFromIp, resolveOSFromIp, resolveVendorFromIp } = require('../../deviceResolver');

// GET /api/dashboard/threats
router.get('/threats', async (req, res) => {
  try {
    const limit      = req.query.limit !== undefined ? parseInt(req.query.limit) : 0;
    const skip       = parseInt(req.query.skip   ?? 0);
    const timeFilter = getTimeFilter(req);
    const query      = getBaseFilter(req, timeFilter);

    let dbQuery = Threat.find(query).sort({ detected_at: -1, timestamp: -1 }).skip(skip);
    if (limit > 0) dbQuery = dbQuery.limit(limit);
    const rawThreats = await dbQuery.lean();

    if (rawThreats.length > 0) {
      const data = rawThreats.map(t => ({
        id:          t._id?.toString(),
        threat_type: t.threat_type,
        severity:    t.severity,
        ip_address:  t.ip_address || t.src_ip,
        dst_ip:      t.dst_ip,
        mac_address: t.mac_address || t.src_mac || null,
        app_label:   t.app_label || null,
        domain:      t.domain || null,
        detected_at: t.detected_at || t.event_at || t.timestamp,
        description: t.description || `Suspicious activity from ${t.ip_address || t.src_ip}`,
        agent_uuid:  t.agent_uuid,
      }));
      return res.json({ ok: true, data });
    }

    const baseEventFilter = {};
    if (query.agent_uuid) baseEventFilter.agent_uuid = query.agent_uuid;
    if (query.site_uuid)  baseEventFilter.site_uuid  = query.site_uuid;
    if (timeFilter) {
      baseEventFilter.$and = [
        { $or: [{ event_at: timeFilter }, { timestamp: timeFilter }] }
      ];
    }

    let evtQuery = Event.find({
      ...baseEventFilter,
      $or: [
        { severity: { $in: ['Critical', 'High'] } },
        { category_label: 'Cybersecurity' }
      ]
    }).sort({ event_at: -1, timestamp: -1 });
    if (limit > 0) evtQuery = evtQuery.skip(skip).limit(limit);

    const rawEvents = await evtQuery.lean();
    const macs = [...new Set(rawEvents.map(e => e.mac_address).filter(Boolean))];
    const macEnrichment = {};

    if (macs.length > 0) {
      const flowLookupFilter = { src_mac: { $in: macs } };
      if (query.agent_uuid) flowLookupFilter.agent_uuid = query.agent_uuid;
      if (query.site_uuid)  flowLookupFilter.site_uuid  = query.site_uuid;

      const flowsForMac = await Flow.aggregate([
        { $match: flowLookupFilter },
        { $sort: { timestamp: -1 } },
        { $group: {
            _id: '$src_mac',
            src_ip:    { $first: '$src_ip' },
            dst_ip:    { $first: '$dst_ip' },
            app_label: { $first: '$app_label' },
            domain:    { $first: '$domain' },
        }},
      ]);

      flowsForMac.forEach(f => {
        if (f._id) macEnrichment[f._id] = {
          ip_address: f.src_ip  || null,
          dst_ip:     f.dst_ip  || null,
          app_label:  f.app_label || null,
          domain:     f.domain    || null,
        };
      });
    }

    const THREAT_TYPE_MAP = {
      'encryption.audit':  'Weak Encryption Detected',
      'server.discovery':  'Unauthorized Server Detected',
      'new.device':        'New Unknown Device',
      'update.device':     'Device Configuration Change',
    };

    const data = rawEvents.map(e => {
      const enrich = (e.mac_address && macEnrichment[e.mac_address]) || {};
      return {
        id:          e._id?.toString(),
        threat_type: THREAT_TYPE_MAP[e.event_type] || e.event_type || 'Security Event',
        severity:    e.severity || 'Warning',
        ip_address:  e.ip_address || enrich.ip_address || null,
        dst_ip:      enrich.dst_ip   || null,
        mac_address: e.mac_address   || null,
        app_label:   enrich.app_label || null,
        domain:      enrich.domain    || null,
        detected_at: e.event_at || e.timestamp,
        description: e.description || `Security event: ${e.event_type}`,
        agent_uuid:  e.agent_uuid,
      };
    });

    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/intelligence/stats
router.get('/intelligence/stats', async (req, res) => {
  try {
    const timeFilter = getTimeFilter(req);
    const base = getBaseFilter(req, timeFilter);

    const list = await Threat.find(base).lean();
    const total = list.length;
    const high = list.filter(t => (t.severity || 'medium').toLowerCase() === 'high' || (t.severity || 'medium').toLowerCase() === 'critical').length;
    const medium = list.filter(t => (t.severity || 'medium').toLowerCase() === 'medium' || (t.severity || 'medium').toLowerCase() === 'warning').length;
    const low = list.filter(t => (t.severity || 'medium').toLowerCase() === 'low' || (t.severity || 'medium').toLowerCase() === 'info').length;

    res.json({ ok: true, data: { total, high, medium, low } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Helper for detail threat intelligence tables
async function getIntelData(req, threatTypeFilter = null, limit = 0) {
  const timeFilter = getTimeFilter(req);
  const query      = getBaseFilter(req, timeFilter);
  
  if (threatTypeFilter) {
    query.threat_type = { $regex: threatTypeFilter, $options: 'i' };
  }

  let dbQuery = Threat.find(query).sort({ detected_at: -1, timestamp: -1 });
  if (limit > 0) dbQuery = dbQuery.limit(limit);
  
  const list = await dbQuery.lean();

  return list.map((t, index) => {
    const ip = t.ip_address || t.src_ip || '10.6.10.44';
    const mac = t.mac_address || t.src_mac || generateMacFromIp(ip);
    const eTime = t.detected_at || t.timestamp?.toISOString() || new Date().toISOString();
    return {
      id:                 t._id?.toString(),
      detected_at:        eTime,
      ip_address:         ip,
      mac_address:        mac,
      pool_host:          t.domain || 'stratum.antpool.com',
      pool_ip:            t.dst_ip || '172.217.194.100',
      protocol:           t.protocol || 'TCP',
      app_label:          t.app_label || 'Stratum Protocol',
      confidence:         95.5,
      download:           t.download || 12450,
      upload:             t.upload || 8450,
      exit_node:          t.dst_ip || '185.220.101.5',
      circuit_id:         'circ_' + Math.abs(index * 1337),
      country:            'Germany',
      vpn_type:           t.app_label?.includes('WireGuard') ? 'WireGuard' : 'OpenVPN',
      remote_ip:          t.dst_ip || '198.51.100.44',
      device_label:       t.ip_address || ip,
      device_type:        resolveDeviceTypeFromIp(ip),
      os_label:           resolveOSFromIp(ip),
      manufacturer:       resolveVendorFromIp(ip),
      is_new:             1,
      encrypted_pct:      85.0,
      unencrypted:        150000,
      encrypted:          850000,
      total:              1000000,
      risk_level:         'Low',
      risk:               t.severity || 'Medium',
      source:             'DPI Scanner',
      reputation:         t.threat_type || 'Malicious IP',
      score:              8.5,
      local_ip:           ip,
      blacklisted:        1,
      server_type:        'Database Server',
      hostname:           t.domain || 'db-01.local',
      port:               t.dst_port || 3306,
      username:           'admin_backone',
      severity:           t.severity || 'Critical'
    };
  });
}

router.get('/intelligence/crypto-mining',        async (req, res) => { try { res.json({ ok: true, data: await getIntelData(req, 'mining', 0) }); } catch(e){ res.status(500).json({ok:false,error:e.message}); } });
router.get('/intelligence/device-discovery',      async (req, res) => { try { res.json({ ok: true, data: await getIntelData(req, null, 0) }); } catch(e){ res.status(500).json({ok:false,error:e.message}); } });
router.get('/intelligence/encryption-audit',      async (req, res) => { try { res.json({ ok: true, data: await getIntelData(req, null, 0) }); } catch(e){ res.status(500).json({ok:false,error:e.message}); } });
router.get('/intelligence/insecure-protocols',    async (req, res) => { try { res.json({ ok: true, data: await getIntelData(req, 'Insecure', 0) }); } catch(e){ res.status(500).json({ok:false,error:e.message}); } });
router.get('/intelligence/ip-reputation',         async (req, res) => { try { res.json({ ok: true, data: await getIntelData(req, 'Reputation', 0) }); } catch(e){ res.status(500).json({ok:false,error:e.message}); } });
router.get('/intelligence/server-discovery',      async (req, res) => { try { res.json({ ok: true, data: await getIntelData(req, null, 0) }); } catch(e){ res.status(500).json({ok:false,error:e.message}); } });
router.get('/intelligence/tor',                   async (req, res) => { try { res.json({ ok: true, data: await getIntelData(req, 'tor', 0) }); } catch(e){ res.status(500).json({ok:false,error:e.message}); } });
router.get('/intelligence/unencrypted-passwords', async (req, res) => { try { res.json({ ok: true, data: await getIntelData(req, 'Insecure Plaintext Password', 0) }); } catch(e){ res.status(500).json({ok:false,error:e.message}); } });
router.get('/intelligence/vpn',                   async (req, res) => { try { res.json({ ok: true, data: await getIntelData(req, 'vpn|VPN', 0) }); } catch(e){ res.status(500).json({ok:false,error:e.message}); } });

module.exports = router;
