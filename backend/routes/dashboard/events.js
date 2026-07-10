const express = require('express');
const router  = express.Router();
const { Event } = require('../../models/Schemas');
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

    const data = events.map(e => ({
      id:          e._id?.toString() || e.event_id,
      event_type:  e.event_type,
      severity:    e.severity,
      message:     e.description || 'System event triggered',
      source_ip:   e.ip_address || null,
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
