const express = require('express');
const router  = express.Router();
const { CountryStat, Flow } = require('../../models/Schemas');
const { getTimeFilter, getBaseFilter, topFlowField } = require('./helpers');
const { resolveIPContinent, resolveIPGeography } = require('./geoResolver');

// GET /api/dashboard/countries
router.get('/countries', async (req, res) => {
  try {
    const timeFilter = getTimeFilter(req);
    const matchBase  = getBaseFilter(req, timeFilter);

    let raw = await CountryStat.aggregate([
      { $match: matchBase },
      { $group: {
          _id:          '$country_code',
          country_name: { $first: '$country_name' },
          download:     { $sum: '$download' },
          upload:       { $sum: '$upload' },
          flow_count:   { $sum: '$flows' },
      }},
      { $project: {
          country_code: '$_id',
          country_name: 1,
          download:     1,
          upload:       1,
          flow_count:   1,
          _id: 0,
      }},
      { $sort: { download: -1 } },
    ]);

    if (raw.length === 0) {
      const flows = await Flow.find({ ...matchBase, dst_ip: { $ne: null } }).lean();
      if (flows.length > 0) {
        const countryMap = {};
        for (const f of flows) {
          const geo = resolveIPGeography(f.dst_ip);
          const countryName = geo.country_name || 'Unknown Country';
          let countryCode = 'ID';
          if (countryName === 'Singapore') countryCode = 'SG';
          else if (countryName === 'United States') countryCode = 'US';
          else if (countryName === 'Japan') countryCode = 'JP';
          else if (countryName === 'Australia') countryCode = 'AU';
          
          if (!countryMap[countryCode]) {
            countryMap[countryCode] = {
              country_code: countryCode,
              country_name: countryName,
              download: 0,
              upload: 0,
              flow_count: 0
            };
          }
          countryMap[countryCode].download += (f.download || 0);
          countryMap[countryCode].upload += (f.upload || 0);
          countryMap[countryCode].flow_count += 1;
        }
        raw = Object.values(countryMap).sort((a, b) => b.download - a.download);
      }
    }

    res.json({ ok: true, data: raw });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/continents
router.get('/continents', async (req, res) => {
  try {
    const limit      = parseInt(req.query.limit ?? 10);
    const timeFilter = getTimeFilter(req);
    const matchBase  = getBaseFilter(req, timeFilter);

    const raw = await Flow.aggregate([
      { $match: { ...matchBase, dst_ip: { $ne: null } } },
      { $group: { _id: '$dst_ip', download: { $sum: '$download' }, upload: { $sum: '$upload' } } },
    ]);

    const map = {};
    for (const r of raw) {
      const name = resolveIPContinent(r._id);
      if (!map[name]) {
        map[name] = {
          continent_name: name,
          download: 0,
          upload: 0,
          total: 0
        };
      }
      map[name].download += r.download;
      map[name].upload += r.upload;
      map[name].total += (r.download + r.upload);
    }
    const data = Object.values(map).sort((a, b) => b.download - a.download).slice(0, limit);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/regions
router.get('/regions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit ?? 20);
    const raw = await topFlowField('dst_ip', req, limit);
    const map = {};
    for (const r of raw) {
      const geo = resolveIPGeography(r.label);
      const key = `${geo.region_name}:${geo.country_name}`;
      if (!map[key]) {
        map[key] = {
          region_name: geo.region_name,
          country_name: geo.country_name,
          download: 0,
          upload: 0,
          count: 0
        };
      }
      map[key].download += r.download;
      map[key].upload += r.upload;
      map[key].count += r.count;
    }
    const data = Object.values(map).sort((a, b) => b.download - a.download).slice(0, limit);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/cities
router.get('/cities', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit ?? 20);
    const raw = await topFlowField('dst_ip', req, limit);
    const map = {};
    for (const r of raw) {
      const geo = resolveIPGeography(r.label);
      const key = `${geo.city_name}:${geo.region_name}:${geo.country_name}`;
      if (!map[key]) {
        map[key] = {
          city_name: geo.city_name,
          region_name: geo.region_name,
          country_name: geo.country_name,
          download: 0,
          upload: 0,
          count: 0
        };
      }
      map[key].download += r.download;
      map[key].upload += r.upload;
      map[key].count += r.count;
    }
    const data = Object.values(map).sort((a, b) => b.download - a.download).slice(0, limit);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/dns
router.get('/dns', async (req, res) => {
  try {
    const limit      = req.query.limit !== undefined ? parseInt(req.query.limit) : 0;
    const timeFilter = getTimeFilter(req);
    const matchBase  = getBaseFilter(req, timeFilter);
    const { SniHostnameStat } = require('../../models/SchemasTelemetry');

    const pipeline = [
      { $match: { ...matchBase, sni_hostname: { $ne: null } } },
      { $group: {
          _id:      '$sni_hostname',
          download: { $sum: '$download' },
          upload:   { $sum: '$upload' },
          count:    { $sum: '$flows' }
      }},
      { $project: { 
          domain: '$_id', 
          query_count: '$count', 
          download: 1, 
          upload: 1, 
          app_label: { $literal: null }, 
          category: { $literal: null }, 
          _id: 0 
      }},
      { $sort: { query_count: -1 } },
    ];
    if (limit > 0) {
      pipeline.push({ $limit: limit });
    }

    const data = await SniHostnameStat.aggregate(pipeline);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
