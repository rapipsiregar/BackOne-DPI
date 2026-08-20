// backend/routes/dashboard/threats.js
const express = require('express');
const router = express.Router();
const { Threat } = require('../../models/Schemas');
const { getTimeFilter, getBaseFilter } = require('./helpers');
const { mapThreatData } = require('./threatsHelper');
const threatsIntelRouter = require('./threatsIntel');

// Mount sub-router for intelligence endpoints under /intelligence
router.use('/intelligence', threatsIntelRouter);

// GET /api/dashboard/threats
router.get('/threats', async (req, res) => {
  try {
    const timeFilter = getTimeFilter(req);
    const query = getBaseFilter(req, timeFilter);

    const threats = await Threat.find(query)
      .sort({ timestamp: -1 })
      .lean();

    const data = mapThreatData(threats);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;

