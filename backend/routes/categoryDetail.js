// backend/routes/categoryDetail.js
// ─────────────────────────────────────────────────────────────────────────────
// Category Detail endpoint for the BackOne Network Intelligence page.
// Returns the real MongoDB breakdown for a clicked category.
// GET /api/dashboard/category-detail?category=<CategoryName>
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const { DeviceAppStat, DeviceStat, LookupApp } = require('../models/Schemas');

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

// ─── GET /api/dashboard/category-detail ───────────────────────────────────────
router.get('/', async (req, res) => {
  const { category } = req.query;
  if (!category) return res.status(400).json({ ok: false, error: 'category is required' });

  const base = buildBaseFilter(req);
  try {
    // Lookup all application labels that belong to this category
    const appsInCategory = await LookupApp.find({ 'application_category.label': category }).lean();
    const appLabels = appsInCategory.map(app => app.label);

    if (appLabels.length === 0) {
      return res.json({ ok: true, category, apps: [], devices: [] });
    }

    const filter = { ...base, app_label: { $in: appLabels } };

    // 1. Get Top Apps for this category
    const topAppsData = await DeviceAppStat.aggregate([
      { $match: filter },
      { $group: {
          _id:        '$app_label',
          download:   { $sum: '$download' },
          upload:     { $sum: '$upload' },
          flows:      { $sum: '$flows' },
          agent_uuid: { $first: '$agent_uuid' },
          last_seen:  { $max: '$timestamp' }
      }},
      { $sort: { download: -1 } },
      { $limit: 200 }
    ]);

    const apps = topAppsData.map(r => ({
      app_label:  r._id,
      download:   r.download,
      upload:     r.upload,
      flows:      r.flows,
      agent_uuid: r.agent_uuid,
      last_seen:  r.last_seen
    }));

    // 2. Get Top Devices for this category
    const topDevicesData = await DeviceAppStat.aggregate([
      { $match: filter },
      { $group: {
          _id:        '$ip_address',
          download:   { $sum: '$download' },
          upload:     { $sum: '$upload' },
          flows:      { $sum: '$flows' },
          agent_uuid: { $first: '$agent_uuid' },
          last_seen:  { $max: '$timestamp' }
      }},
      { $sort: { download: -1 } },
      { $limit: 200 }
    ]);

    // Enrich devices with DeviceStat info (mac, os, manufacturer)
    const { generateMacFromIp, resolveVendorFromIp, resolveOSFromIp, generateAutoLabel } = require('../deviceResolver');
    const ips = topDevicesData.map(r => r._id).filter(Boolean);
    
    const agentFilter = {};
    if (base.agent_uuid) agentFilter.agent_uuid = base.agent_uuid;
    if (base.site_uuid)  agentFilter.site_uuid  = base.site_uuid;

    const devicesInfo = await DeviceStat.find({ ip_address: { $in: ips }, ...agentFilter }).lean();
    const deviceMap = {};
    for (const d of devicesInfo) deviceMap[d.ip_address] = d;

    const devices = topDevicesData.map(r => {
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
        last_seen:    r.last_seen
      };
    });

    res.json({
      ok: true,
      category,
      apps,
      devices
    });

  } catch (error) {
    console.error(`[CategoryDetail] Error:`, error);
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
});

module.exports = router;
