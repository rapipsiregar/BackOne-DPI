const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');
const { AppStat, ProtocolStat, AppCategoryStat, LookupApp } = require('../../models/Schemas');
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

    let result = await AppStat.aggregate(pipeline);

    // Fallback: if no AppStat records exist, aggregate from Flow
    if (result.length === 0) {
      const { Flow } = require('../../models/Schemas');
      const flowPipeline = [
        { $match: { ...base, app_label: { $ne: null, $ne: '' } } },
        { $group: {
            _id:      '$app_label',
            download: { $sum: '$download' },
            upload:   { $sum: '$upload' },
            flows:    { $sum: 1 },
        }},
        { $sort: { download: -1 } },
        { $limit: limit }
      ];
      result = await Flow.aggregate(flowPipeline);
    }
    
    // Fetch lookup metadata (category and favicon) to enrich apps list
    const labels = result.map(r => r._id);
    const lookups = await LookupApp.find({ label: { $in: labels } }).lean();
    const lookupMap = {};
    for (const app of lookups) {
      lookupMap[app.label] = {
        favicon: app.favicon || app.logo || null,
        category: app.application_category?.label || null
      };
    }

    const formatted = result.map(r => ({
      app_label: r._id,
      download:  r.download || 0,
      upload:    r.upload || 0,
      flows:     r.flows || 0,
      category:  lookupMap[r._id]?.category || null,
      favicon:   lookupMap[r._id]?.favicon || null,
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

    let result = await ProtocolStat.aggregate(pipeline);

    // Fallback: if no ProtocolStat records exist, aggregate from Flow
    if (result.length === 0) {
      const { Flow } = require('../../models/Schemas');
      const flowPipeline = [
        { $match: { ...base, protocol: { $ne: null, $ne: '' } } },
        { $group: {
            _id:      '$protocol',
            download: { $sum: '$download' },
            upload:   { $sum: '$upload' },
            flows:    { $sum: 1 },
        }},
        { $sort: { download: -1 } }
      ];
      result = await Flow.aggregate(flowPipeline);
    }
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
    const search = String(req.query.search || req.query.q || '').trim();
    const category = String(req.query.category || '').trim();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 25);
    const skip = (page - 1) * limit;

    let filter = {};
    if (search) {
      filter.$or = [
        { label: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { tag: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      filter['application_category.label'] = category;
    }

    const [applications, total_records] = await Promise.all([
      LookupApp.find(filter).sort({ label: 1 }).skip(skip).limit(limit).lean(),
      LookupApp.countDocuments(filter)
    ]);

    const total_pages = Math.ceil(total_records / limit) || 1;

    res.json({
      ok: true,
      data: {
        applications,
        pagination: {
          total_records,
          total_pages,
          current_page: page,
          start: skip,
          length: applications.length,
          limit
        }
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/lookup/categories
router.get('/lookup/categories', async (req, res) => {
  try {
    const categories = await LookupApp.distinct('application_category.label');
    const validCategories = categories.filter(c => c).sort();
    res.json({ ok: true, data: validCategories });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
