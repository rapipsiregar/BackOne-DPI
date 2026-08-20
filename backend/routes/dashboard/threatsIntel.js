// backend/routes/dashboard/threatsIntel.js
const express = require('express');
const router  = express.Router();
const { Threat, Event, DeviceStat } = require('../../models/Schemas');
const { getTimeFilter, getBaseFilter } = require('./helpers');
const { getIntelData } = require('./threatsHelper');

router.get('/crypto-mining',        async (req, res) => { try { res.json({ ok: true, data: await getIntelData(Threat, req, 'mining', 0) }); } catch(e){ res.status(500).json({ok:false,error:e.message}); } });
router.get('/insecure-protocols',    async (req, res) => { try { res.json({ ok: true, data: await getIntelData(Threat, req, 'Insecure', 0) }); } catch(e){ res.status(500).json({ok:false,error:e.message}); } });
router.get('/ip-reputation',         async (req, res) => { try { res.json({ ok: true, data: await getIntelData(Threat, req, 'Reputation', 0) }); } catch(e){ res.status(500).json({ok:false,error:e.message}); } });
router.get('/tor',                   async (req, res) => { try { res.json({ ok: true, data: await getIntelData(Threat, req, 'tor', 0) }); } catch(e){ res.status(500).json({ok:false,error:e.message}); } });
router.get('/unencrypted-passwords', async (req, res) => { try { res.json({ ok: true, data: await getIntelData(Threat, req, 'password', 0) }); } catch(e){ res.status(500).json({ok:false,error:e.message}); } });
router.get('/vpn',                   async (req, res) => { try { res.json({ ok: true, data: await getIntelData(Threat, req, 'vpn', 0) }); } catch(e){ res.status(500).json({ok:false,error:e.message}); } });

router.get('/device-discovery', async (req, res) => {
  try {
    const timeFilter = getTimeFilter(req);
    const query = getBaseFilter(req, timeFilter);
    const devices = await DeviceStat.find(query).sort({ timestamp: -1 }).lean();
    
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

router.get('/encryption-audit', async (req, res) => {
  try {
    const timeFilter = getTimeFilter(req);
    const query = getBaseFilter(req, timeFilter);
    const devices = await DeviceStat.find(query).sort({ timestamp: -1 }).lean();
    
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
          encrypted_pct: 85,
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

router.get('/server-discovery', async (req, res) => {
  try {
    const timeFilter = getTimeFilter(req);
    const query = getBaseFilter(req, timeFilter);
    query.event_type = 'server.discovery';
    
    const events = await Event.find(query).sort({ timestamp: -1 }).lean();
    const macs = events.map(e => e.mac_address).filter(Boolean);
    const agentFilter = {};
    if (query.agent_uuid) agentFilter.agent_uuid = query.agent_uuid;
    if (query.site_uuid)  agentFilter.site_uuid  = query.site_uuid;
    const devices = await DeviceStat.find({ mac_address: { $in: macs }, ...agentFilter }).lean();
    const macMap = {};
    devices.forEach(d => { macMap[d.mac_address] = d; });

    const data = events.map(e => {
      let serverType = e.category_label || 'Local Server';
      let osLabel = 'Unknown';
      let port = 0;
      
      const match = e.description?.match(/Detected (.*?) server on (.*)/i);
      if (match) {
        serverType = match[1].trim();
        osLabel = match[2].trim();
      }

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

router.get('/stats', async (req, res) => {
  try {
    const timeFilter = getTimeFilter(req);
    const query = getBaseFilter(req, timeFilter);

    const [
      cryptoCount,
      torCount,
      vpnCount,
      ipRepCount,
      insecureCount,
      passwordsCount,
      deviceCount,
      serverCount
    ] = await Promise.all([
      Threat.countDocuments({ ...query, threat_type: { $regex: 'mining', $options: 'i' } }),
      Threat.countDocuments({ ...query, threat_type: { $regex: 'tor', $options: 'i' } }),
      Threat.countDocuments({ ...query, threat_type: { $regex: 'vpn', $options: 'i' } }),
      Threat.countDocuments({ ...query, threat_type: { $regex: 'Reputation', $options: 'i' } }),
      Threat.countDocuments({ ...query, threat_type: { $regex: 'Insecure', $options: 'i' } }),
      Threat.countDocuments({ ...query, threat_type: { $regex: 'password', $options: 'i' } }),
      DeviceStat.distinct('ip_address', query).then(ips => ips.length),
      Event.countDocuments({ ...query, event_type: 'server.discovery' })
    ]);

    res.json({
      ok: true,
      data: {
        intel_crypto_mining: cryptoCount,
        intel_tor_detection: torCount,
        intel_vpn_detection: vpnCount,
        intel_ip_reputation: ipRepCount,
        intel_insecure_protocols: insecureCount,
        intel_unencrypted_passwords: passwordsCount,
        intel_encryption_audit: deviceCount,
        intel_device_discovery: deviceCount,
        intel_server_discovery: serverCount
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;

