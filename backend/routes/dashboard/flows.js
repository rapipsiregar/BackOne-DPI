const express = require('express');
const router  = express.Router();
const { Flow, DeviceStat } = require('../../models/Schemas');
const { getTimeFilter, getBaseFilter, topFlowField, getCustomLabelsMap } = require('./helpers');

// GET /api/dashboard/flows-options
router.get('/flows-options', async (req, res) => {
  try {
    const timeFilter = getTimeFilter(req);
    const query      = getBaseFilter(req, timeFilter);

    // Parallel distinct queries on indexed keys
    const [protocols, srcIps, dstIps, dstPorts, apps, domains] = await Promise.all([
      Flow.distinct('protocol', query),
      Flow.distinct('src_ip', query),
      Flow.distinct('dst_ip', query),
      Flow.distinct('dst_port', query),
      Flow.distinct('app_label', query),
      Flow.distinct('domain', query)
    ]);

    res.json({
      ok: true,
      data: {
        protocols: protocols.filter(Boolean).sort(),
        srcIps: srcIps.filter(Boolean).sort(),
        dstIps: dstIps.filter(Boolean).sort(),
        dstPorts: dstPorts.filter(Boolean).sort().map(String),
        apps: apps.filter(Boolean).sort(),
        domains: domains.filter(Boolean).sort()
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/flows
router.get('/flows', async (req, res) => {
  try {
    const rawLimit   = parseInt(req.query.limit  ?? 50);
    const skip       = parseInt(req.query.skip   ?? 0);
    const limit      = rawLimit <= 0 ? 0 : Math.min(rawLimit, 1000000);
    const timeFilter = getTimeFilter(req);
    const query      = getBaseFilter(req, timeFilter);

    // Apply query filters on MongoDB
    if (req.query.protocol && req.query.protocol !== 'All') {
      query.protocol = req.query.protocol;
    }
    if (req.query.src_ip && req.query.src_ip !== 'All') {
      query.src_ip = req.query.src_ip;
    }
    if (req.query.dst_ip && req.query.dst_ip !== 'All') {
      query.dst_ip = req.query.dst_ip;
    }
    if (req.query.dst_port && req.query.dst_port !== 'All') {
      query.dst_port = parseInt(req.query.dst_port);
    }
    if (req.query.app && req.query.app !== 'All') {
      query.app_label = req.query.app;
    }
    if (req.query.domain && req.query.domain !== 'All') {
      query.domain = req.query.domain;
    }

    if (req.query.search) {
      const q = req.query.search.trim();
      if (q) {
        query.$or = [
          { src_ip: { $regex: q, $options: 'i' } },
          { dst_ip: { $regex: q, $options: 'i' } }
        ];
      }
    }

    if (limit === 0) {
      const total = await Flow.countDocuments(query);
      console.log('[BACKEND /flows] countOnly total:', total);
      return res.json({ ok: true, data: { flows: [], total } });
    }

    // Apply sorting
    let sortObj = { timestamp: -1 };
    if (req.query.sort_download === 'Descending') {
      sortObj = { download: -1 };
    } else if (req.query.sort_download === 'Ascending') {
      sortObj = { download: 1 };
    } else if (req.query.sort_upload === 'Descending') {
      sortObj = { upload: -1 };
    } else if (req.query.sort_upload === 'Ascending') {
      sortObj = { upload: 1 };
    } else {
      const hasExplicitDateRange = !!(req.query.date_from || req.query.date_to);
      sortObj = { timestamp: hasExplicitDateRange ? 1 : -1 };
    }

    console.log('[BACKEND /flows] Constructed MongoDB query:', JSON.stringify(query));

    const deviceFilter = {};
    if (query.site_uuid) deviceFilter.site_uuid = query.site_uuid;

    const [raw, customLabelsMap, devicesList] = await Promise.all([
      Flow.find(query).sort(sortObj).skip(skip).limit(limit).lean(),
      getCustomLabelsMap(),
      DeviceStat.find(deviceFilter, { ip_address: 1, mac_address: 1 }).lean()
    ]);

    const total = await Flow.countDocuments(query);
    console.log(`[BACKEND /flows] Found total: ${total}, returning slice length: ${raw.length}`);

    // Build IP to MAC map for real client resolution
    const ipToMacMap = {};
    devicesList.forEach(d => {
      if (d.ip_address && d.mac_address && d.mac_address !== '-') {
        ipToMacMap[d.ip_address] = d.mac_address.toLowerCase();
      }
    });

    const data = raw.map(f => {
      const port = f.dst_port ?? 0;
      const proto = f.protocol || 'TCP';
      
      let app = f.app_label;
      let dom = f.domain;
      if (!app || app.includes('Port null')) {
        if (proto === 'IPv6-ICMP' || proto === 'ICMP') {
          app = 'ICMP Network Diagnostics';
          dom = 'ICMP Probe';
        } else if (proto === 'IGMP') {
          app = 'IGMP Multicast Routing';
          dom = '224.0.0.22';
        } else {
          app = port > 0 ? `Port ${port}` : 'Unclassified Service';
          dom = f.dst_ip || 'Local Link';
        }
      }

      // Try resolving MAC from IP-to-MAC map first, fallback to flow src_mac
      const flowMac = (f.src_mac || '').toLowerCase();
      const realMac = ipToMacMap[f.src_ip] || flowMac;
      const srcLabel = customLabelsMap[realMac] || customLabelsMap[flowMac] || null;

      return {
        id:             f._id?.toString(),
        fetched_at:     f.timestamp,
        flow_id:        f.flow_id,
        src_ip:         f.src_ip,
        src_mac:        f.src_mac,
        src_label:      srcLabel,
        dst_ip:         f.dst_ip,
        dst_port:       port,
        protocol:       proto,
        app_label:      app,
        domain:         dom,
        bytes_download: f.download || 0,
        bytes_upload:   f.upload   || 0,
        download:       f.download || 0,
        upload:         f.upload   || 0,
        first_seen:     f.first_seen,
        last_seen:      f.last_seen,
        agent_uuid:     f.agent_uuid,
      };
    });

    res.json({ ok: true, data: { flows: data, total } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
