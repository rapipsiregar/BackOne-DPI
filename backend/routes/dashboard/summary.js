const express = require('express');
const router  = express.Router();
const { Summary, DeviceStat, Flow, Threat, Event } = require('../../models/Schemas');
const { getTimeFilter, getBaseFilter, getCustomLabelsMap } = require('./helpers');
const { generateMacFromIp, resolveDeviceTypeFromIp, resolveOSFromIp, resolveVendorFromIp, generateAutoLabel } = require('../../deviceResolver');

// GET /api/dashboard/summary
router.get('/summary', async (req, res) => {
  try {
    const timeFilter = getTimeFilter(req);
    const base = getBaseFilter(req, timeFilter);
    const baseWithoutTime = getBaseFilter(req, null);

    const latestDoc = await Summary.findOne(baseWithoutTime).sort({ timestamp: -1 });

    let latestTime = null;
    let bandwidthDown = 0;
    let bandwidthUp = 0;
    let totalDevicesCount = 0;
    let activeFlowsCount = 0;

    if (latestDoc) {
      latestTime = latestDoc.timestamp;
      const summaries = await Summary.find({ ...baseWithoutTime, timestamp: latestTime }).lean();
      
      bandwidthDown = summaries.reduce((s, r) => s + (r.bandwidth_down ?? 0), 0);
      bandwidthUp   = summaries.reduce((s, r) => s + (r.bandwidth_up ?? 0), 0);
      totalDevicesCount  = summaries.reduce((s, r) => s + (r.total_devices ?? 0), 0);
      activeFlowsCount   = summaries.reduce((s, r) => s + (r.active_flows ?? 0), 0);
    }

    const [fallbackDevices, fallbackFlows, fallbackFlowBandwidth, realThreatsCount, realEventsCount, fallbackThreatsCount] = await Promise.all([
      DeviceStat.distinct('ip_address', base).then(r => r.length),
      Flow.countDocuments(base),
      Flow.aggregate([
        { $match: base },
        { $group: { _id: null, down: { $sum: '$download' }, up: { $sum: '$upload' } } }
      ]),
      Threat.countDocuments(base),
      Event.countDocuments(base),
      Event.countDocuments({
        ...base,
        $or: [
          { severity: { $in: ['Critical', 'High'] } },
          { category_label: 'Cybersecurity' }
        ]
      })
    ]);

    const flowDown = fallbackFlowBandwidth[0]?.down || 0;
    const flowUp = fallbackFlowBandwidth[0]?.up || 0;

    let finalDown = bandwidthDown > 0 ? bandwidthDown : flowDown;
    let finalUp   = bandwidthUp > 0 ? bandwidthUp : flowUp;
    let finalDevices = fallbackDevices;
    let finalActiveFlows = activeFlowsCount > 0 ? activeFlowsCount : fallbackFlows;

    const range = req.query.timeRange || '1d';
    if (range !== 'all' && range !== '1d') {
      const scaleMap = {
        '5m':  1 / (24 * 12),
        '10m': 1 / (24 * 6),
        '30m': 1 / 48,
        '1h':  1 / 24,
        '7d':  7,
      };
      const multiplier = scaleMap[range] ?? 1;
      finalDown = Math.round(finalDown * multiplier);
      finalUp   = Math.round(finalUp * multiplier);
      finalActiveFlows = Math.round(finalActiveFlows * multiplier);
    }

    res.json({
      ok: true,
      data: {
        total_devices:  finalDevices,
        total_threats:  realThreatsCount > 0 ? realThreatsCount : fallbackThreatsCount,
        total_events:   realEventsCount,
        last_fetch:     latestTime || new Date(),
        bandwidth_down: finalDown,
        bandwidth_up:   finalUp,
        active_flows:   finalActiveFlows,
        download_speed: latestDoc?.download_speed  ?? 0,
        upload_speed:   latestDoc?.upload_speed    ?? 0,
        flow_speed:     0,
      }
    });
  } catch (err) {
    console.error('[/summary]', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/timeline
router.get('/timeline', async (req, res) => {
  try {
    const points     = parseInt(req.query.points ?? 60);
    const timeFilter = getTimeFilter(req);
    const query      = getBaseFilter(req, timeFilter);

    const data = await Summary
      .find(query)
      .sort({ timestamp: -1 })
      .limit(points)
      .lean();

    const formatted = data.reverse().map(s => {
      const activeFlows = s.active_flows || 0;
      const totalBandwidth = (s.bandwidth_down || 0) + (s.bandwidth_up || 0);

      const cpu_usage = s.cpu_usage !== undefined && s.cpu_usage !== null 
        ? s.cpu_usage 
        : Math.min(98, Math.max(1.2, parseFloat((2.5 + (activeFlows * 0.04) + (totalBandwidth / 10000000)).toFixed(2))));

      const memory_usage = s.memory_usage !== undefined && s.memory_usage !== null 
        ? s.memory_usage 
        : Math.min(99, Math.max(10.5, parseFloat((15.4 + (activeFlows * 0.02) + (totalBandwidth / 25000000)).toFixed(2))));

      const queue_depth = s.queue_depth !== undefined && s.queue_depth !== null 
        ? s.queue_depth 
        : Math.max(0, Math.floor((activeFlows * 0.15) + (totalBandwidth / 5000000)));

      return {
        fetched_at:     s.timestamp,
        timestamp:      s.timestamp,
        total_download: s.bandwidth_down  ?? 0,
        total_upload:   s.bandwidth_up    ?? 0,
        total_flows:    s.active_flows    ?? 0,
        download_speed: s.download_speed  ?? 0,
        upload_speed:   s.upload_speed    ?? 0,
        packet_drops:   s.packet_drops    ?? 0,
        peak_flow_rate: s.peak_flow_rate  ?? 0,
        cpu_usage,
        memory_usage,
        queue_depth,
        flow_speed:     0,
      };
    });

    res.json({ ok: true, data: formatted });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/data-interval
router.get('/data-interval', (req, res) => {
  res.json({ ok: true, data: [] });
});

// GET /api/dashboard/agent-details?uuid=xxx
router.get('/agent-details', (req, res) => {
  require('../agentDetailsHandler')(req, res, {
    getTimeFilter,
    generateMacFromIp,
    resolveDeviceTypeFromIp,
    resolveOSFromIp,
    resolveVendorFromIp,
    generateAutoLabel,
    getCustomLabelsMap
  });
});

module.exports = router;
