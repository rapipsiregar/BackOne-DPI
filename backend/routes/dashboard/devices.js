const express = require('express');
const router  = express.Router();
const { DeviceStat, CustomDeviceLabel, Flow } = require('../../models/Schemas');
const { getTimeFilter, getBaseFilter, getCustomLabelsMap } = require('./helpers');
const { generateMacFromIp, resolveDeviceTypeFromIp, resolveOSFromIp, resolveVendorFromIp, generateAutoLabel } = require('../../deviceResolver');

// GET /api/dashboard/devices
router.get('/devices', async (req, res) => {
  try {
    const limit      = req.query.limit !== undefined ? parseInt(req.query.limit) : 0;
    const skip       = parseInt(req.query.skip   ?? 0);
    const timeFilter = getTimeFilter(req);
    const query      = getBaseFilter(req, timeFilter);

    let dbQuery = DeviceStat.find(query).sort({ timestamp: -1, download: -1 }).skip(skip);
    if (limit > 0) dbQuery = dbQuery.limit(limit);

    const [data, customLabelsMap] = await Promise.all([
      dbQuery,
      getCustomLabelsMap()
    ]);

    const mapped = data.map(d => {
      const obj = d.toObject();
      const ip = obj.ip_address;
      
      const mac = obj.mac_address && obj.mac_address !== '-' ? obj.mac_address : generateMacFromIp(ip);
      const type = obj.device_type && obj.device_type !== '-' && obj.device_type !== 'Unknown' ? obj.device_type : resolveDeviceTypeFromIp(ip);
      const os = obj.os_label && obj.os_label !== '-' && obj.os_label !== 'Unknown' ? obj.os_label : resolveOSFromIp(ip);
      const man = obj.manufacturer && obj.manufacturer !== '-' && obj.manufacturer !== 'Unknown' ? obj.manufacturer : resolveVendorFromIp(ip);
      const lastSeen = obj.last_seen || obj.timestamp || new Date().toISOString();
      const baseLabel = customLabelsMap[mac] || obj.device_label;
      const label = baseLabel && baseLabel !== '-' && baseLabel !== 'Unknown' && baseLabel !== 'Generic Client'
        ? baseLabel
        : generateAutoLabel(ip, mac, man, type);

      return {
        ...obj,
        id: obj._id.toString(),
        mac_address: mac,
        device_label: label,
        device_type: type,
        os_label: os,
        manufacturer: man,
        last_seen: lastSeen
      };
    });
    res.json({ ok: true, data: mapped });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/dashboard/devices/update-label
router.post('/devices/update-label', async (req, res) => {
  try {
    const { mac_address, device_label } = req.body;
    if (!mac_address) return res.status(400).json({ ok: false, error: 'mac_address required' });
    if (device_label === undefined) return res.status(400).json({ ok: false, error: 'device_label required' });

    await CustomDeviceLabel.findOneAndUpdate(
      { mac_address },
      { device_label },
      { upsert: true, new: true }
    );

    res.json({ ok: true, message: 'Device label updated successfully' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/mac-bandwidth
router.get('/mac-bandwidth', async (req, res) => {
  try {
    const limit      = parseInt(req.query.limit ?? 50);
    const timeFilter = getTimeFilter(req);
    const matchBase  = getBaseFilter(req, timeFilter);

    const raw = await DeviceStat.aggregate([
      { $match: { ...matchBase } },
      { $group: {
          _id:          { $ifNull: [ '$mac_address', '$ip_address' ] },
          download:     { $sum: '$download' },
          upload:       { $sum: '$upload' },
          ip:           { $last: '$ip_address' },
          mac_address:  { $last: '$mac_address' },
          label:        { $last: '$device_label' },
          manufacturer: { $last: '$manufacturer' }
      }},
      { $project: {
          mac_address:  1,
          download:     1,
          upload:       1,
          ip:           1,
          label:        1,
          manufacturer: { $ifNull: [ '$manufacturer', 'Intel Corporation' ] },
          total:        { $add: [ '$download', '$upload' ] },
          _id:          0
      }},
      { $sort: { total: -1 } },
      { $limit: limit },
    ]);

    const data = raw.map(d => {
      const mac = d.mac_address && d.mac_address !== '-' ? d.mac_address : generateMacFromIp(d.ip);
      const man = d.manufacturer && d.manufacturer !== '-' && d.manufacturer !== 'Unknown' ? d.manufacturer : resolveVendorFromIp(d.ip);
      return {
        ...d,
        mac_address: mac,
        manufacturer: man
      };
    });

    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/security-devices
router.get('/security-devices', async (req, res) => {
  try {
    const timeFilter = getTimeFilter(req);
    const baseFilter = getBaseFilter(req, timeFilter);

    const uniqueDevices = await DeviceStat.aggregate([
      { $match: { site_uuid: baseFilter.site_uuid } },
      { $sort: { timestamp: -1 } },
      { $group: {
          _id: '$ip_address',
          latestDoc: { $first: '$$ROOT' }
      }}
    ]);

    const flowStats = await Flow.aggregate([
      { $match: baseFilter },
      { $group: {
          _id: '$src_ip',
          total_bytes: { $sum: { $add: ['$download', '$upload'] } },
          encrypted_bytes: {
            $sum: {
              $cond: [
                { $in: ['$dst_port', [443, 8443, 853, 465, 989, 990, 587]] },
                { $add: ['$download', '$upload'] },
                0
              ]
            }
          }
      }}
    ]);

    const flowMap = {};
    flowStats.forEach(fs => {
      if (fs._id) {
        flowMap[fs._id] = {
          total: fs.total_bytes || 0,
          encrypted: fs.encrypted_bytes || 0
        };
      }
    });

    const customLabelsMap = await getCustomLabelsMap();

    const mapped = uniqueDevices.map(d => {
      const obj = d.latestDoc;
      const ip = obj.ip_address;
      const mac = obj.mac_address && obj.mac_address !== '-' ? obj.mac_address : generateMacFromIp(ip);
      const type = obj.device_type && obj.device_type !== '-' && obj.device_type !== 'Unknown' ? obj.device_type : resolveDeviceTypeFromIp(ip);
      const os = obj.os_label && obj.os_label !== '-' && obj.os_label !== 'Unknown' ? obj.os_label : resolveOSFromIp(ip);
      const man = obj.manufacturer && obj.manufacturer !== '-' && obj.manufacturer !== 'Unknown' ? obj.manufacturer : resolveVendorFromIp(ip);
      const baseLabel = customLabelsMap[mac] || obj.device_label;
      const label = baseLabel && baseLabel !== '-' && baseLabel !== 'Unknown' && baseLabel !== 'Generic Client'
        ? baseLabel
        : generateAutoLabel(ip, mac, man, type);

      const fStat = flowMap[ip] || { total: 0, encrypted: 0 };
      const encrypted = fStat.encrypted;
      const unencrypted = Math.max(0, fStat.total - encrypted);
      const encrypted_pct = fStat.total > 0 ? (encrypted / fStat.total) * 100 : 0;

      let risk_level = 'Safe';
      if (fStat.total > 0) {
        if (encrypted_pct < 50) risk_level = 'Vulnerable';
        else if (encrypted_pct < 80) risk_level = 'Moderate';
      }

      return {
        _id: obj._id.toString(),
        ip_address: ip,
        mac_address: mac,
        device_label: label,
        device_type: type,
        os_label: os,
        manufacturer: man,
        encrypted,
        unencrypted,
        encrypted_pct,
        risk_level,
        has_insecure: unencrypted > encrypted * 2
      };
    });

    res.json({ ok: true, data: mapped });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;
