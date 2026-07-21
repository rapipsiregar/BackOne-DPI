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

    let bandwidthDown = 0;
    let bandwidthUp = 0;
    let activeFlowsCount = 0;
    let downloadSpeed = 0;
    let uploadSpeed = 0;
    let latestTime = null;

    if (base.agent_uuid) {
      // ── Agent-Level Summary (View As Agent mode) ─────────────────────────────
      // The proxy saves per-agent summaries with agent_uuid = <uuid>.
      // Use the latest one for the scoped agent instead of site aggregates.
      const latestAgentSummary = await Summary
        .findOne(baseWithoutTime)
        .sort({ timestamp: -1 })
        .lean();

      if (latestAgentSummary) {
        bandwidthDown    = latestAgentSummary.bandwidth_down  || 0;
        bandwidthUp      = latestAgentSummary.bandwidth_up    || 0;
        activeFlowsCount = latestAgentSummary.active_flows    || 0;
        downloadSpeed    = latestAgentSummary.download_speed  || 0;
        uploadSpeed      = latestAgentSummary.upload_speed    || 0;
        latestTime       = latestAgentSummary.timestamp;
      }
    } else {
      // ── Site-Level Summary (default) ─────────────────────────────────────────
      // Use site-level snapshots (agent_uuid=null) to avoid double-counting
      // across agents when no specific agent scope is active.
      const siteIds = baseWithoutTime.site_uuid
        ? [baseWithoutTime.site_uuid]
        : await Summary.distinct('site_uuid', { agent_uuid: null });

      for (const siteId of siteIds) {
        const latestSiteSummary = await Summary
          .findOne({ agent_uuid: null, site_uuid: siteId })
          .sort({ timestamp: -1 })
          .lean();

        if (latestSiteSummary) {
          // Apply time filter: only use if within the requested time range
          if (timeFilter && latestSiteSummary.timestamp < timeFilter) continue;

          bandwidthDown    += latestSiteSummary.bandwidth_down  || 0;
          bandwidthUp      += latestSiteSummary.bandwidth_up    || 0;
          activeFlowsCount += latestSiteSummary.active_flows    || 0;
          downloadSpeed    += latestSiteSummary.download_speed  || 0;
          uploadSpeed      += latestSiteSummary.upload_speed    || 0;
          if (!latestTime || latestSiteSummary.timestamp > latestTime) {
            latestTime = latestSiteSummary.timestamp;
          }
        }
      }

      // Fallback: if no site-level summaries exist yet, aggregate from per-agent summaries
      if (bandwidthDown === 0 && bandwidthUp === 0) {
        const latestAgentDoc = await Summary.findOne(baseWithoutTime).sort({ timestamp: -1 });
        if (latestAgentDoc) {
          latestTime = latestAgentDoc.timestamp;
          const agentSummaries = await Summary.find({ ...baseWithoutTime, timestamp: latestAgentDoc.timestamp }).lean();
          bandwidthDown    = agentSummaries.reduce((s, r) => s + (r.bandwidth_down ?? 0), 0);
          bandwidthUp      = agentSummaries.reduce((s, r) => s + (r.bandwidth_up ?? 0), 0);
          activeFlowsCount = agentSummaries.reduce((s, r) => s + (r.active_flows ?? 0), 0);
          downloadSpeed    = agentSummaries.reduce((s, r) => s + (r.download_speed ?? 0), 0);
          uploadSpeed      = agentSummaries.reduce((s, r) => s + (r.upload_speed ?? 0), 0);
        }
      }
    }

    // Device count, Threats, Events — always use the scoped base filter
    // (already contains agent_uuid when in AGENT_VIEWER mode)
    const [uniqueDevices, realThreatsCount, realEventsCount] = await Promise.all([
      DeviceStat.distinct('ip_address', base).then(r => r.length),
      Threat.countDocuments(base),
      Event.countDocuments(base),
    ]);

    res.json({
      ok: true,
      data: {
        total_devices:  uniqueDevices,
        total_threats:  realThreatsCount,
        total_events:   realEventsCount,
        last_fetch:     latestTime || new Date(),
        bandwidth_down: bandwidthDown,
        bandwidth_up:   bandwidthUp,
        active_flows:   activeFlowsCount,
        download_speed: downloadSpeed,
        upload_speed:   uploadSpeed,
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
