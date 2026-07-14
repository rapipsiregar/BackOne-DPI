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
    const isAuthorized = req.user?.role === 'SUPER_ADMIN' ||
      req.user?.role === 'TENANT_ADMIN' ||
      req.user?._originalRole === 'SUPER_ADMIN' ||
      req.user?._originalRole === 'TENANT_ADMIN';

    if (!isAuthorized) {
      return res.status(403).json({ ok: false, error: 'Forbidden: Admin access only' });
    }
    const query = {};
    const effectiveRole = req.user?._originalRole || req.user?.role;
    if (effectiveRole === 'TENANT_ADMIN') {
      query.site_uuid = req.user.site_uuid;
    }
    const agents = await Summary.distinct('agent_uuid', query);
    res.json({ ok: true, count: agents.length, agents });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/agents/storage
// Returns per-agent total data size from in-memory cache (capacityTracker).
// Cache is computed once at startup and refreshed every 5-minute collection cycle.
// Values represent total MongoDB storage footprint per agent (across 7-day retention window).
router.get('/agents/storage', async (req, res) => {
  try {
    const isAuthorized = req.user?.role === 'SUPER_ADMIN' ||
      req.user?.role === 'TENANT_ADMIN' ||
      req.user?._originalRole === 'SUPER_ADMIN' ||
      req.user?._originalRole === 'TENANT_ADMIN';

    if (!isAuthorized) {
      return res.status(403).json({ ok: false, error: 'Forbidden: Admin access only' });
    }

    const { agentSizesCache, lastCacheUpdate } = require('../../db/capacityTracker');
    const storage  = agentSizesCache();
    const cachedAt = lastCacheUpdate();

    res.json({ ok: true, storage, cached_at: cachedAt });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});


module.exports = router;
