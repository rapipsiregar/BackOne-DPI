const express = require('express');
const router  = express.Router();
const { TlsVersionStat, TlsCipherStat, TlsSecurityStat } = require('../../models/Schemas');
const { getTimeFilter, getBaseFilter } = require('./helpers');

// GET /api/dashboard/tls-versions
router.get('/tls-versions', async (req, res) => {
  try {
    const limit      = req.query.limit !== undefined ? parseInt(req.query.limit) : 10;
    const timeFilter = getTimeFilter(req);
    const matchBase  = getBaseFilter(req, timeFilter);

    const data = await TlsVersionStat.aggregate([
      { $match: matchBase },
      { $group: {
          _id:      '$tls_version',
          download: { $sum: '$download' },
          upload:   { $sum: '$upload' },
      }},
      { $project: { tls_version: '$_id', download: 1, upload: 1, total: { $add: ['$download', '$upload'] }, _id: 0 } },
      { $sort: { total: -1 } },
    ]);

    const finalData = limit > 0 ? data.slice(0, limit) : data;
    res.json({ ok: true, data: finalData });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/tls-ciphers
router.get('/tls-ciphers', async (req, res) => {
  try {
    const limit      = req.query.limit !== undefined ? parseInt(req.query.limit) : 15;
    const timeFilter = getTimeFilter(req);
    const matchBase  = getBaseFilter(req, timeFilter);

    const data = await TlsCipherStat.aggregate([
      { $match: matchBase },
      { $group: {
          _id:      '$tls_cipher',
          download: { $sum: '$download' },
          upload:   { $sum: '$upload' },
      }},
      { $project: { tls_cipher: '$_id', download: 1, upload: 1, total: { $add: ['$download', '$upload'] }, _id: 0 } },
      { $sort: { total: -1 } },
    ]);

    const finalData = limit > 0 ? data.slice(0, limit) : data;
    res.json({ ok: true, data: finalData });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/tls-security
router.get('/tls-security', async (req, res) => {
  try {
    const timeFilter = getTimeFilter(req);
    const matchBase  = getBaseFilter(req, timeFilter);

    const raw = await TlsSecurityStat.aggregate([
      { $match: matchBase },
      { $group: {
          _id:      '$tls_security',
          download: { $sum: '$download' },
          upload:   { $sum: '$upload' },
      }},
      { $project: {
          tls_security: '$_id',
          download: 1,
          upload:   1,
          total:    { $add: ['$download', '$upload'] },
          _id: 0
      }},
      { $sort: { total: -1 } }
    ]);

    const data = raw.map(r => {
      let color = '#bc8cff';
      const label = (r.tls_security || '').toLowerCase();
      if (label === 'recommended') color = '#3fb950';
      else if (label === 'weak')    color = '#f0883e';
      else if (label === 'secure')  color = '#58a6ff';
      else if (label === 'insecure') color = '#f85149';
      return { ...r, color };
    });

    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
