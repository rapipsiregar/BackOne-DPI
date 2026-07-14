const express = require('express');
const router  = express.Router();
const { Threat, Event, Flow, DeviceStat } = require('../../models/Schemas');
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

    // Get real counts for all 9 categories
    const [
      intel_crypto_mining,
      intel_tor_detection,
      intel_vpn_detection,
      intel_ip_reputation,
      intel_insecure_protocols,
      intel_unencrypted_passwords,
      rawDevices,
      intel_server_discovery
    ] = await Promise.all([
      Threat.countDocuments({ ...base, threat_type: /mining/i }),
      Threat.countDocuments({ ...base, threat_type: /tor/i }),
      Threat.countDocuments({ ...base, threat_type: /vpn/i }),
      Threat.countDocuments({ ...base, threat_type: /reputation/i }),
      Threat.countDocuments({ ...base, threat_type: /insecure/i, $nor: [{ threat_type: /password/i }] }),
      Threat.countDocuments({ ...base, threat_type: /password/i }),
      DeviceStat.distinct('ip_address', base),
      Event.countDocuments({ ...base, event_type: 'server.discovery' })
    ]);

    const intel_device_discovery = rawDevices.length;
    const intel_encryption_audit = rawDevices.length; // Same as devices for now, as each device is audited

    res.json({ 
      ok: true, 
      data: { 
        intel_crypto_mining,
        intel_tor_detection,
        intel_vpn_detection,
        intel_ip_reputation,
        intel_insecure_protocols,
        intel_unencrypted_passwords,
        intel_encryption_audit,
        intel_device_discovery,
        intel_server_discovery
      } 
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Helper for detail threat intelligence tables
async function getIntelData(req, threatTypeRegex = null, limit = 0) {
  const timeFilter = getTimeFilter(req);
  const query      = getBaseFilter(req, timeFilter);
  
  if (threatTypeRegex) {
    query.threat_type = { $regex: threatTypeRegex, $options: 'i' };
  }

  let dbQuery = Threat.find(query).sort({ detected_at: -1, timestamp: -1 });
  if (limit > 0) dbQuery = dbQuery.limit(limit);
  
  const list = await dbQuery.lean();

  return list.map((t) => {
    const ip = t.ip_address || t.src_ip;
    const mac = t.mac_address || t.src_mac;
    const eTime = t.detected_at || t.timestamp?.toISOString() || new Date().toISOString();
    return {
      id:                 t._id?.toString(),
      detected_at:        eTime,
      ip_address:         ip,
      mac_address:        mac,
      pool_host:          t.domain || null,
      pool_ip:            t.dst_ip || null,
      protocol:           t.protocol || 'TCP',
      app_label:          t.app_label || 'Unknown',
      confidence:         t.severity === 'Critical' ? 99 : (t.severity === 'High' ? 90 : 75),
      download:           t.download || 0,
      upload:             t.upload || 0,
      exit_node:          t.dst_ip || null,
      circuit_id:         t.flow_id || null,
      country:            'Unknown', // Geo IP not in Threat schema yet
      vpn_type:           t.app_label || 'Unknown VPN',
      remote_ip:          t.dst_ip || null,
      device_label:       ip,
      device_type:        'Unknown',
      os_label:           'Unknown',
      manufacturer:       'Unknown',
      risk_level:         t.severity || 'Medium',
      risk:               t.severity || 'Medium',
      reputation:         t.threat_type || 'Malicious IP',
      severity:           t.severity || 'Warning'
    };
  });
}

router.get('/intelligence/crypto-mining',        async (req, res) => { try { res.json({ ok: true, data: await getIntelData(req, 'mining', 0) }); } catch(e){ res.status(500).json({ok:false,error:e.message}); } });
router.get('/intelligence/insecure-protocols',    async (req, res) => { try { res.json({ ok: true, data: await getIntelData(req, 'Insecure', 0) }); } catch(e){ res.status(500).json({ok:false,error:e.message}); } });
router.get('/intelligence/ip-reputation',         async (req, res) => { try { res.json({ ok: true, data: await getIntelData(req, 'Reputation', 0) }); } catch(e){ res.status(500).json({ok:false,error:e.message}); } });
router.get('/intelligence/tor',                   async (req, res) => { try { res.json({ ok: true, data: await getIntelData(req, 'tor', 0) }); } catch(e){ res.status(500).json({ok:false,error:e.message}); } });
router.get('/intelligence/unencrypted-passwords', async (req, res) => { try { res.json({ ok: true, data: await getIntelData(req, 'password', 0) }); } catch(e){ res.status(500).json({ok:false,error:e.message}); } });
router.get('/intelligence/vpn',                   async (req, res) => { try { res.json({ ok: true, data: await getIntelData(req, 'vpn', 0) }); } catch(e){ res.status(500).json({ok:false,error:e.message}); } });

// Specialized Intelligence Data
router.get('/intelligence/device-discovery', async (req, res) => {
  try {
    const timeFilter = getTimeFilter(req);
    const query = getBaseFilter(req, timeFilter);
    const devices = await require('../../models/Schemas').DeviceStat.find(query).sort({ timestamp: -1 }).lean();
    
    const uniqueMap = new Map();
    devices.forEach(d => {
      if (!uniqueMap.has(d.ip_address)) {
        uniqueMap.set(d.ip_address, {
          id: d._id?.toString(),
          ip_address: d.ip_address,
          mac_address: d.mac_address || '-',
          device_type: d.device_type || 'Unknown',
          os_label: d.os_label || 'Unknown',
          manufacturer: d.manufacturer || 'Unknown',
          download: d.download || 0,
          upload: d.upload || 0,
          last_seen: d.timestamp || new Date()
        });
      }
    });
    res.json({ ok: true, data: Array.from(uniqueMap.values()) });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.get('/intelligence/encryption-audit', async (req, res) => {
  try {
    const timeFilter = getTimeFilter(req);
    const query = getBaseFilter(req, timeFilter);
    const devices = await require('../../models/Schemas').DeviceStat.find(query).sort({ timestamp: -1 }).lean();
    
    const uniqueMap = new Map();
    devices.forEach(d => {
      if (!uniqueMap.has(d.ip_address)) {
        const download = d.download || 0;
        const upload = d.upload || 0;
        uniqueMap.set(d.ip_address, {
          id: d._id?.toString(),
          ip_address: d.ip_address,
          mac_address: d.mac_address || '-',
          device_label: d.device_label || d.ip_address,
          encrypted_pct: 85, // Default for now as per DPI capability
          unencrypted: Math.floor(download * 0.15),
          encrypted: Math.floor(download * 0.85),
          total: download + upload,
          risk_level: download > 1024 * 1024 * 1024 ? 'medium' : 'safe',
          last_seen: d.last_seen || d.timestamp || new Date().toISOString()
        });
      }
    });
    res.json({ ok: true, data: Array.from(uniqueMap.values()) });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.get('/intelligence/server-discovery', async (req, res) => {
  try {
    const timeFilter = getTimeFilter(req);
    const query = getBaseFilter(req, timeFilter);
    query.event_type = 'server.discovery';
    
    const events = await Event.find(query).sort({ timestamp: -1 }).lean();
    
    // Resolve IPs using DeviceStat
    const macs = events.map(e => e.mac_address).filter(Boolean);
    const agentFilter = {};
    if (query.agent_uuid) agentFilter.agent_uuid = query.agent_uuid;
    if (query.site_uuid)  agentFilter.site_uuid  = query.site_uuid;
    const devices = await DeviceStat.find({ mac_address: { $in: macs }, ...agentFilter }).lean();
    const macMap = {};
    devices.forEach(d => {
      macMap[d.mac_address] = d;
    });

    const data = events.map(e => {
      let serverType = e.category_label || 'Local Server';
      let osLabel = 'Unknown';
      let port = 0;
      
      // Parse description: "Detected DHCP server on External Gateway"
      const match = e.description?.match(/Detected (.*?) server on (.*)/i);
      if (match) {
        serverType = match[1].trim();
        osLabel = match[2].trim();
      }

      // Infer Port
      const sTypeUpper = serverType.toUpperCase();
      if (sTypeUpper.includes('DHCP')) port = 67;
      else if (sTypeUpper.includes('DNS')) port = 53;
      else if (sTypeUpper.includes('SSH')) port = 22;
      else if (sTypeUpper.includes('HTTP')) port = 80;
      else if (sTypeUpper.includes('HTTPS')) port = 443;
      else if (sTypeUpper.includes('FTP')) port = 21;

      const device = macMap[e.mac_address] || {};

      return {
        id: e._id?.toString(),
        ip_address: e.ip_address || device.ip_address || null,
        mac_address: e.mac_address,
        server_type: serverType,
        port: port,
        os_label: osLabel !== 'Unknown' ? osLabel : (device.os_label || 'Unknown'),
        last_seen: e.event_at || e.timestamp || device.last_seen || device.timestamp || new Date().toISOString()
      };
    });
    res.json({ ok: true, data });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

module.exports = router;
