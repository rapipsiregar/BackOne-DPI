const express = require('express');
const router  = express.Router();
const { Event, DeviceStat, Flow } = require('../../models/Schemas');
const { getTimeFilter, getBaseFilter } = require('./helpers');

// GET /api/dashboard/events
router.get('/events', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit ?? 0);
    const timeFilter = getTimeFilter(req);
    const base = getBaseFilter(req, timeFilter);

    let query = Event.find(base).sort({ timestamp: -1 });
    if (limit > 0) {
      query = query.limit(limit);
    }

    const events = await query.lean();

    // Collect all MAC addresses for events missing IP addresses
    const missingIpMacs = [...new Set(events.filter(e => !e.ip_address && e.mac_address).map(e => e.mac_address))];
    
    // Lookup DeviceStat for these MACs
    let macToIpMap = {};
    if (missingIpMacs.length > 0) {
      const baseFilterNull = getBaseFilter(req, null);
      const filterForDevices = { 
        mac_address: { $in: missingIpMacs }, 
        ...baseFilterNull 
      };
      const devices = await DeviceStat.find(filterForDevices).lean();
      for (const d of devices) {
        macToIpMap[d.mac_address] = d.ip_address;
      }

      // Fallback: Query Flow collection for remaining unresolved MACs
      const unresolvedMacs = missingIpMacs.filter(mac => !macToIpMap[mac]);
      if (unresolvedMacs.length > 0) {
        for (const mac of unresolvedMacs) {
          const flow = await Flow.findOne({ src_mac: mac, ...baseFilterNull }).sort({ timestamp: -1 }).lean();
          if (flow && flow.src_ip) {
            macToIpMap[mac] = flow.src_ip;
          }
        }
      }
    }

    const data = events.map(e => ({
      id:          e._id?.toString() || e.event_id,
      event_type:  e.event_type,
      severity:    e.severity,
      message:     e.description || 'System event triggered',
      source_ip:   e.ip_address || macToIpMap[e.mac_address] || null,
      mac_address: e.mac_address || null,
      timestamp:   e.timestamp,
    }));

    res.json({ ok: true, data });
  } catch (err) {
    console.error('[/events]', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
