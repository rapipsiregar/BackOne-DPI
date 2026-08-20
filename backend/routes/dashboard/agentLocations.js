const express = require('express');
const router  = express.Router();
const { CustomAgentLocation, Summary, DeviceStat, Flow } = require('../../models/Schemas');
const { getTimeFilter } = require('./helpers');

// ─── 1. GET /api/dashboard/agent-locations ──────────────────────────────────────
router.get('/agent-locations', async (req, res) => {
  try {
    const isGlobalUser = req.user?.role === 'SUPER_ADMIN' ||
      ((!req.user?.site_uuid || req.user?.site_uuid === 'default') && ['SOC_ANALYST', 'ENGINEER'].includes(req.user?.role));

    let query = {};
    if (!isGlobalUser && req.user?.site_uuid) {
      query.site_uuid = req.user.site_uuid;
    }
    if (req.user?.role === 'AGENT_VIEWER' && req.user?.agent_uuid) {
      query.agent_uuid = req.user.agent_uuid;
    }

    const locations = await CustomAgentLocation.find(query).lean();
    res.json({ ok: true, data: locations });
  } catch (err) {
    console.error('[GET /agent-locations]', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 2. POST /api/dashboard/agent-locations ─────────────────────────────────────
router.post('/agent-locations', async (req, res) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'TENANT_ADMIN') {
      return res.status(403).json({ ok: false, error: 'Only administrators can configure agent geolocations.' });
    }
    const { agent_uuid, latitude, longitude, label } = req.body;
    if (!agent_uuid || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ ok: false, error: 'agent_uuid, latitude, and longitude are required' });
    }

    // Determine site_uuid
    let siteUuid = null;
    const isGlobalUser = req.user?.role === 'SUPER_ADMIN' ||
      ((!req.user?.site_uuid || req.user?.site_uuid === 'default') && ['SOC_ANALYST', 'ENGINEER'].includes(req.user?.role));

    if (!isGlobalUser && req.user?.site_uuid) {
      const agentBelongs = await Summary.findOne({ agent_uuid, site_uuid: req.user.site_uuid });
      if (!agentBelongs) {
        return res.status(403).json({ ok: false, error: 'Unauthorized: This agent does not belong to your tenant.' });
      }
      siteUuid = req.user.site_uuid;
    } else {
      // Find the site_uuid from Summary collection for this agent
      const summaryDoc = await Summary.findOne({ agent_uuid });
      if (summaryDoc) {
        siteUuid = summaryDoc.site_uuid;
      } else {
        // Fallback or use standard env site_uuid
        siteUuid = process.env.BACKONE_SITE_UUID || '6681452d_9cae_4ff4_8ae8_0d504774265e';
      }
    }

    const findQuery = { agent_uuid };
    if (!isGlobalUser && req.user?.site_uuid) {
      findQuery.site_uuid = req.user.site_uuid;
    }

    const upserted = await CustomAgentLocation.findOneAndUpdate(
      findQuery,
      {
        agent_uuid,
        site_uuid: siteUuid,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        label: label || ''
      },
      { new: true, upsert: true }
    );

    res.json({ ok: true, data: upserted });
  } catch (err) {
    console.error('[POST /agent-locations]', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 3. DELETE /api/dashboard/agent-locations/:agent_uuid ────────────────────────
router.delete('/agent-locations/:agent_uuid', async (req, res) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'TENANT_ADMIN') {
      return res.status(403).json({ ok: false, error: 'Only administrators can delete agent geolocations.' });
    }
    const { agent_uuid } = req.params;
    
    let query = { agent_uuid };
    const isGlobalUser = req.user?.role === 'SUPER_ADMIN' ||
      ((!req.user?.site_uuid || req.user?.site_uuid === 'default') && ['SOC_ANALYST', 'ENGINEER'].includes(req.user?.role));

    if (!isGlobalUser && req.user?.site_uuid) {
      query.site_uuid = req.user.site_uuid;
    }

    const resDelete = await CustomAgentLocation.deleteOne(query);
    res.json({ ok: true, deleted: resDelete.deletedCount > 0 });
  } catch (err) {
    console.error('[DELETE /agent-locations]', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 4. GET /api/dashboard/agent-flows ──────────────────────────────────────────
router.get('/agent-flows', async (req, res) => {
  try {
    const requestedSiteUuid = req.headers['x-backone-site-uuid'];
    const isGlobalUser = req.user?.role === 'SUPER_ADMIN' ||
      ((!req.user?.site_uuid || req.user?.site_uuid === 'default') && ['SOC_ANALYST', 'ENGINEER'].includes(req.user?.role));

    const siteUuid = (isGlobalUser && requestedSiteUuid)
      ? requestedSiteUuid
      : (req.user?.site_uuid || '6681452d_9cae_4ff4_8ae8_0d504774265e');

    const timeFilter = getTimeFilter(req);

    // Build IP-to-Agent mapping from DeviceStat
    const deviceQuery = { site_uuid: siteUuid };
    if (req.user?.role === 'AGENT_VIEWER' && req.user?.agent_uuid) {
      deviceQuery.agent_uuid = req.user.agent_uuid;
    }
    const devices = await DeviceStat.find(deviceQuery).select('ip_address agent_uuid').lean();
    const deviceIpToAgent = {};
    for (const dev of devices) {
      if (dev.ip_address && dev.agent_uuid) {
        deviceIpToAgent[dev.ip_address] = dev.agent_uuid;
      }
    }

    // Query flows
    const flowsQuery = { site_uuid: siteUuid };
    if (timeFilter) flowsQuery.timestamp = timeFilter;
    if (req.user?.role === 'AGENT_VIEWER' && req.user?.agent_uuid) {
      flowsQuery.agent_uuid = req.user.agent_uuid;
    }

    const flows = await Flow.find(flowsQuery)
      .select('agent_uuid src_ip dst_ip download upload app_label')
      .sort({ timestamp: -1 })
      .limit(5000)
      .lean();

    const flowMap = {};
    for (const flow of flows) {
      const srcAgent = flow.agent_uuid;
      const dstAgent = deviceIpToAgent[flow.dst_ip];

      if (srcAgent && dstAgent && srcAgent !== dstAgent) {
        const key = `${srcAgent}->${dstAgent}`;
        if (!flowMap[key]) {
          flowMap[key] = {
            source: srcAgent,
            target: dstAgent,
            bytes: 0,
            flowsCount: 0,
            details: []
          };
        }
        const bytes = ((flow.download || 0) + (flow.upload || 0));
        flowMap[key].bytes += bytes;
        flowMap[key].flowsCount += 1;
        flowMap[key].details.push({
          src_ip: flow.src_ip,
          dst_ip: flow.dst_ip,
          app: flow.app_label || 'Unclassified',
          bytes: bytes
        });
      }
    }

    const result = Object.values(flowMap);
    for (const f of result) {
      f.details.sort((a, b) => b.bytes - a.bytes);
      f.details = f.details.slice(0, 5); // top 5 sub-flows
    }
    res.json({ ok: true, data: result });
  } catch (err) {
    console.error('[GET /agent-flows]', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
