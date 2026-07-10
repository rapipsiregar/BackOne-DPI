// backend/routes/dashboard/agents.js
// ─────────────────────────────────────────────────────────────────────────────
// Agent Management and Telemetry API Router
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');
const { Summary } = require('../../models/Schemas');
const { getTimeFilter } = require('./helpers');

// GET /api/dashboard/agents/uptime
router.get('/agents/uptime', async (req, res) => {
  try {
    const range = req.query.timeRange || '1d';
    const cyclesMap = {
      '5m': 1,
      '30m': 6,
      '1h': 12,
      '1d': 288,
      '7d': 2016,
    };

    const ideal = cyclesMap[range] ?? 12;
    let timeFilter = getTimeFilter(req);
    if (!timeFilter) {
      const now = new Date();
      timeFilter = { $gte: new Date(now.getTime() - 7 * 24 * 3600000) };
    }

    const query = { timestamp: timeFilter };
    if (req.user?.site_uuid) query.site_uuid = req.user.site_uuid;

    const stats = await Summary.aggregate([
      { $match: query },
      { $group: { _id: "$agent_uuid", count: { $sum: 1 } } }
    ]);

    const uptimeMap = {};
    stats.forEach(s => {
      if (s._id) {
        const pct = Math.min(100, Math.round((s.count / ideal) * 1000) / 10);
        uptimeMap[s._id] = pct;
      }
    });

    res.json({ ok: true, uptime: uptimeMap });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/agents
router.get('/agents', async (req, res) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?._originalRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ ok: false, error: 'Forbidden: SUPER_ADMIN only' });
    }
    const agents = await Summary.distinct('agent_uuid');
    res.json({ ok: true, count: agents.length, agents });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/agents/storage
router.get('/agents/storage', async (req, res) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?._originalRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ ok: false, error: 'Forbidden: SUPER_ADMIN only' });
    }

    const db = mongoose.connection.db;
    if (!db) {
      return res.json({ ok: true, storage: {} });
    }

    const agentSizes = {};
    const collections = await db.listCollections().toArray();

    for (const colInfo of collections) {
      const colName = colInfo.name;
      if (colName.startsWith('system.')) continue;
      const col = db.collection(colName);

      const sampleDoc = await col.findOne({ agent_uuid: { $ne: null } });
      if (!sampleDoc) continue;

      const pipeline = [
        { $project: { agent_uuid: 1, docSize: { $bsonSize: "$$ROOT" } } },
        { $group: { _id: "$agent_uuid", totalBytes: { $sum: "$docSize" } } }
      ];

      const results = await col.aggregate(pipeline).toArray();
      for (const res of results) {
        const agent = res._id || 'Unknown';
        agentSizes[agent] = (agentSizes[agent] || 0) + res.totalBytes;
      }
    }

    const storageMap = {};
    for (const [agent, bytes] of Object.entries(agentSizes)) {
      storageMap[agent] = parseFloat((bytes / (1024 * 1024)).toFixed(2));
    }

    res.json({ ok: true, storage: storageMap });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
