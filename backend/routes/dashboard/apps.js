const express = require('express');
const router  = express.Router();
const { AppStat, ProtocolStat, AppCategoryStat } = require('../../models/Schemas');
const { getTimeFilter, getBaseFilter } = require('./helpers');

// GET /api/dashboard/apps
router.get('/apps', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || 10);
    const timeFilter = getTimeFilter(req);
    const base = getBaseFilter(req, timeFilter);

    // Group apps by app_label to get aggregate values
    const pipeline = [
      { $match: base },
      { $group: {
          _id:      '$app_label',
          download: { $sum: '$download' },
          upload:   { $sum: '$upload' },
          flows:    { $sum: '$flows' },
      }},
      { $sort: { download: -1 } },
      { $limit: limit }
    ];

    const result = await AppStat.aggregate(pipeline);
    const formatted = result.map(r => ({
      app_label: r._id,
      download:  r.download || 0,
      upload:    r.upload || 0,
      flows:     r.flows || 0,
    }));

    res.json({ ok: true, data: formatted });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/protocols
router.get('/protocols', async (req, res) => {
  try {
    const timeFilter = getTimeFilter(req);
    const base = getBaseFilter(req, timeFilter);

    const pipeline = [
      { $match: base },
      { $group: {
          _id:      '$protocol_label',
          download: { $sum: '$download' },
          upload:   { $sum: '$upload' },
          flows:    { $sum: '$flows' },
      }},
      { $sort: { download: -1 } }
    ];

    const result = await ProtocolStat.aggregate(pipeline);
    const formatted = result.map(r => ({
      protocol_label: r._id,
      download:       r.download || 0,
      upload:         r.upload || 0,
      flows:          r.flows || 0,
    }));

    res.json({ ok: true, data: formatted });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/app-categories
router.get('/app-categories', async (req, res) => {
  try {
    const timeFilter = getTimeFilter(req);
    const base = getBaseFilter(req, timeFilter);

    const pipeline = [
      { $match: base },
      { $group: {
          _id:      '$category_label',
          download: { $sum: '$download' },
          upload:   { $sum: '$upload' },
          flows:    { $sum: '$flows' },
      }},
      { $sort: { download: -1 } }
    ];

    const result = await AppCategoryStat.aggregate(pipeline);
    const formatted = result.map(r => ({
      category_label: r._id,
      download:       r.download || 0,
      upload:         r.upload || 0,
      total:          (r.download || 0) + (r.upload || 0),
    }));

    res.json({ ok: true, data: formatted });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/lookup/applications
router.get('/lookup/applications', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ ok: true, data: [] });

    const baseFilter = getBaseFilter(req, null);
    const apps = await AppStat.distinct('app_label', {
      ...baseFilter,
      app_label: { $regex: q, $options: 'i' }
    });

    res.json({ ok: true, data: apps.map(name => ({ label: name, value: name })) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
