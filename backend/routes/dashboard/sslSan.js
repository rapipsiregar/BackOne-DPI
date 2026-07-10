// backend/routes/dashboard/sslSan.js
// ─────────────────────────────────────────────────────────────────────────────
// Subject Alternative Names (SAN) sub-router for SSL/TLS encryption auditing
// Scopes queries by tenant user state and time filters.
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const { SslSubjectAltNameStat, SslServerCnStat } = require('../../models/Schemas');
const { getTimeFilter, getBaseFilter } = require('./helpers');

// GET /api/dashboard/ssl-subject-alt-names
router.get('/ssl-subject-alt-names', async (req, res) => {
  try {
    const limit      = parseInt(req.query.limit ?? 50);
    const timeFilter = getTimeFilter(req);
    const baseQuery  = getBaseFilter(req, timeFilter);

    // Group by alt_name and sum telemetry volume
    let stats = await SslSubjectAltNameStat.aggregate([
      { $match: baseQuery },
      { $group: {
          _id:      '$alt_name',
          download: { $sum: '$download' },
          upload:   { $sum: '$upload' },
          flows:    { $sum: '$flows' },
      }},
      { $project: {
          alt_name: '$_id',
          download: 1,
          upload:   1,
          flows:    1,
          total:    { $add: ['$download', '$upload'] },
          _id:      0
      }},
      { $sort: { total: -1 } },
      { $limit: limit }
    ]);

    // Fallback to SSL Common Names (CN) if Subject Alternative Names stats are not supported by the license
    if (stats.length === 0) {
      stats = await SslServerCnStat.aggregate([
        { $match: baseQuery },
        { $group: {
            _id:      '$ssl_server_cn',
            download: { $sum: '$download' },
            upload:   { $sum: '$upload' },
            flows:    { $sum: '$flows' },
        }},
        { $project: {
            alt_name: '$_id',
            download: 1,
            upload:   1,
            flows:    1,
            total:    { $add: ['$download', '$upload'] },
            _id:      0
        }},
        { $sort: { total: -1 } },
        { $limit: limit }
      ]);
    }

    res.json({ ok: true, data: stats });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
