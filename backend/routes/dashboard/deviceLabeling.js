const express = require('express');
const router  = express.Router();
const { DeviceStat, CustomDeviceLabel, Flow } = require('../../models/Schemas');
const { getTimeFilter, getBaseFilter, getCustomLabelsMap } = require('./helpers');
const { generateMacFromIp, resolveDeviceTypeFromIp, resolveOSFromIp, resolveVendorFromIp, generateAutoLabel } = require('../../deviceResolver');
const User = require('../../models/User');

// POST /api/dashboard/devices/update-label
router.post('/devices/update-label', async (req, res) => {
  try {
    // EXECUTIVE role is read-only — explicitly blocked from writing labels
    if (req.user?.role === 'EXECUTIVE') {
      return res.status(403).json({ ok: false, error: 'Executive role cannot modify device labels.' });
    }

    const isAuthorized = req.user?.role === 'SUPER_ADMIN' ||
      req.user?.role === 'TENANT_ADMIN' ||
      req.user?._originalRole === 'SUPER_ADMIN' ||
      req.user?._originalRole === 'TENANT_ADMIN';

    if (!isAuthorized) {
      return res.status(403).json({ ok: false, error: 'Only administrators can update device labels.' });
    }

    const { mac_address, device_label } = req.body;
    if (!mac_address) return res.status(400).json({ ok: false, error: 'mac_address required' });
    if (device_label === undefined) return res.status(400).json({ ok: false, error: 'device_label required' });

    const isGlobalUser = req.user?.role === 'SUPER_ADMIN' ||
      ((!req.user?.site_uuid || req.user?.site_uuid === 'default') && ['SOC_ANALYST', 'ENGINEER'].includes(req.user?.role)) ||
      req.user?._originalRole === 'SUPER_ADMIN';

    if (!isGlobalUser && req.user?.site_uuid) {
      const deviceExists = await DeviceStat.findOne({
        mac_address,
        site_uuid: req.user.site_uuid
      });
      if (!deviceExists) {
        return res.status(403).json({ ok: false, error: 'Unauthorized: This device does not belong to your tenant.' });
      }
    }

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

// GET /api/dashboard/devices/labeling
router.get('/devices/labeling', async (req, res) => {
  try {
    const isAuthorized = req.user?.role === 'SUPER_ADMIN' ||
      req.user?.role === 'EXECUTIVE' ||
      req.user?.role === 'TENANT_ADMIN' ||
      req.user?._originalRole === 'SUPER_ADMIN' ||
      req.user?._originalRole === 'TENANT_ADMIN';

    if (!isAuthorized) {
      return res.status(403).json({ ok: false, error: 'Unauthorized: Only administrators can view device labeling directory.' });
    }

    const timeFilter = getTimeFilter(req);
    const query = getBaseFilter(req, timeFilter);

    // Enforce tenant site isolation
    const isGlobalUser = req.user?.role === 'SUPER_ADMIN' ||
      req.user?.role === 'EXECUTIVE' ||
      ((!req.user?.site_uuid || req.user?.site_uuid === 'default') && ['SOC_ANALYST', 'ENGINEER'].includes(req.user?.role)) ||
      req.user?._originalRole === 'SUPER_ADMIN';

    if (!isGlobalUser && req.user?.site_uuid) {
      query.site_uuid = req.user.site_uuid;
    }

    // 1. Group by mac_address to find the latest record for each MAC in DeviceStat (small collection)
    const pipeline = [
      { $match: { ...query, mac_address: { $ne: null, $ne: '-' } } },
      { $sort: { timestamp: -1 } },
      { $group: {
          _id: "$mac_address",
          ip_address: { $first: "$ip_address" },
          device_type: { $first: "$device_type" },
          manufacturer: { $first: "$manufacturer" },
          device_label: { $first: "$device_label" },
          agent_uuid: { $first: "$agent_uuid" },
          timestamp: { $first: "$timestamp" }
      }}
    ];

    // 2. Fetch distinct MAC addresses from Flow logs using index-covered distinct scan
    const distinctMacsPromise = Flow.distinct('src_mac', {
      ...query,
      src_mac: { $ne: null, $ne: '-' }
    });

    const [deviceData, distinctMacs] = await Promise.all([
      DeviceStat.aggregate(pipeline),
      distinctMacsPromise
    ]);

    // 3. Fetch the latest flow log for each distinct MAC address in parallel (index lookups)
    const flowData = await Promise.all(
      distinctMacs.map(async (mac) => {
        const latest = await Flow.findOne({
          ...query,
          src_mac: mac
        })
        .sort({ timestamp: -1 })
        .select('src_ip agent_uuid timestamp')
        .lean();

        if (!latest) return null;
        return {
          _id: mac,
          ip_address: latest.src_ip,
          agent_uuid: latest.agent_uuid,
          timestamp: latest.timestamp
        };
      })
    ).then(results => results.filter(Boolean));

    // Merge results based on MAC Address
    const mergedMap = new Map();

    // Process flow log records as baseline
    flowData.forEach(f => {
      const mac = f._id;
      mergedMap.set(mac, {
        _id: mac,
        ip_address: f.ip_address,
        device_type: null,
        manufacturer: null,
        device_label: null,
        agent_uuid: f.agent_uuid,
        timestamp: f.timestamp
      });
    });

    // Overwrite/merge with DeviceStat records (which has richer profile metadata)
    deviceData.forEach(d => {
      const mac = d._id;
      mergedMap.set(mac, d);
    });

    const data = Array.from(mergedMap.values());

    // Fetch agent user accounts to resolve human-readable labels
    const agentUsers = await User.find({ role: 'AGENT_VIEWER' }).lean();
    const agentMap = {};
    agentUsers.forEach(u => {
      if (u.agent_uuid) {
        agentMap[u.agent_uuid] = u.account_name || u.agent_uuid;
      }
    });

    const customLabelsMap = await getCustomLabelsMap();

    const result = data.map(item => {
      const mac = item._id;
      const customLabel = customLabelsMap[mac] || null;
      const ip = item.ip_address || '-';
      const type = item.device_type && item.device_type !== '-' && item.device_type !== 'Unknown' ? item.device_type : resolveDeviceTypeFromIp(ip);
      const os = item.os_label && item.os_label !== '-' && item.os_label !== 'Unknown' ? item.os_label : resolveOSFromIp(ip);
      const man = item.manufacturer && item.manufacturer !== '-' && item.manufacturer !== 'Unknown' ? item.manufacturer : resolveVendorFromIp(ip);
      
      const baseLabel = item.device_label;
      const defaultLabel = baseLabel && baseLabel !== '-' && baseLabel !== 'Unknown' && baseLabel !== 'Generic Client'
        ? baseLabel
        : generateAutoLabel(ip, mac, man, type);

      const agentUuid = item.agent_uuid || '';
      const agentName = agentMap[agentUuid] || agentUuid || 'Unknown Agent';

      return {
        mac_address: mac,
        ip_address: ip,
        device_type: type,
        manufacturer: man,
        default_label: defaultLabel,
        custom_label: customLabel,
        agent_uuid: agentUuid,
        agent_name: agentName,
        last_seen: item.timestamp || new Date()
      };
    });

    res.json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/devices/mac-details
router.get('/devices/mac-details', async (req, res) => {
  try {
    const isAuthorized = req.user?.role === 'SUPER_ADMIN' ||
      req.user?.role === 'EXECUTIVE' ||
      req.user?.role === 'TENANT_ADMIN' ||
      req.user?._originalRole === 'SUPER_ADMIN' ||
      req.user?._originalRole === 'TENANT_ADMIN';

    if (!isAuthorized) {
      return res.status(403).json({ ok: false, error: 'Unauthorized: Access denied.' });
    }

    const { mac } = req.query;
    if (!mac) return res.status(400).json({ ok: false, error: 'mac parameter required' });

    // Enforce tenant site isolation
    const query = { src_mac: mac };
    const deviceQuery = { mac_address: mac };

    const isGlobalUser = req.user?.role === 'SUPER_ADMIN' ||
      req.user?.role === 'EXECUTIVE' ||
      ((!req.user?.site_uuid || req.user?.site_uuid === 'default') && ['SOC_ANALYST', 'ENGINEER'].includes(req.user?.role)) ||
      req.user?._originalRole === 'SUPER_ADMIN';

    if (!isGlobalUser && req.user?.site_uuid) {
      query.site_uuid = req.user.site_uuid;
      deviceQuery.site_uuid = req.user.site_uuid;
    }

    // 1. Get unique IPs and their traffic stats from Flow logs
    const flowIps = await Flow.aggregate([
      { $match: query },
      { $group: {
          _id: "$src_ip",
          first_seen: { $min: "$timestamp" },
          last_seen: { $max: "$timestamp" },
          download: { $sum: { $ifNull: ["$download", 0] } },
          upload: { $sum: { $ifNull: ["$upload", 0] } },
          flows: { $sum: 1 }
      }},
      { $sort: { last_seen: -1 } }
    ]);

    // 2. Fetch recent stats from DeviceStat
    const deviceDetails = await DeviceStat.find(deviceQuery)
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    res.json({
      ok: true,
      mac_address: mac,
      ips: flowIps.map(item => ({
        ip_address: item._id,
        first_seen: item.first_seen,
        last_seen: item.last_seen,
        download: item.download || 0,
        upload: item.upload || 0,
        flows: item.flows || 0
      })),
      deviceDetails: deviceDetails
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
