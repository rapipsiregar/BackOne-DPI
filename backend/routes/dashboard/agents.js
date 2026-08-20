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
      '30d': 8640,
    };

    const ideal = cyclesMap[range] ?? 12;
    let timeFilter = getTimeFilter(req);
    if (!timeFilter) {
      const now = new Date();
      timeFilter = { $gte: new Date(now.getTime() - 30 * 24 * 3600000) };
    }

    const query = { timestamp: timeFilter };
    const requestedSiteUuid = req.headers['x-backone-site-uuid'];
    const isGlobalUser = req.user?.role === 'SUPER_ADMIN' ||
      req.user?.role === 'EXECUTIVE' ||
      ((!req.user?.site_uuid || req.user?.site_uuid === 'default') && ['SOC_ANALYST', 'ENGINEER'].includes(req.user?.role));
    
    if (isGlobalUser && requestedSiteUuid) {
      query.site_uuid = requestedSiteUuid;
    } else if (req.user?.site_uuid) {
      query.site_uuid = req.user.site_uuid;
    }

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
      req.user?.role === 'EXECUTIVE' ||
      req.user?.role === 'TENANT_ADMIN' ||
      req.user?._originalRole === 'SUPER_ADMIN' ||
      req.user?._originalRole === 'TENANT_ADMIN';

    if (!isAuthorized) {
      return res.status(403).json({ ok: false, error: 'Forbidden: Admin access only' });
    }

    // Always filter out null/empty agent_uuid entries
    const query = { agent_uuid: { $nin: [null, '', undefined] } };

    const effectiveRole = req.user?._originalRole || req.user?.role;
    const isGlobalUser = effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'EXECUTIVE';
    const requestedSiteUuid = req.headers['x-backone-site-uuid'];

    if (isGlobalUser && requestedSiteUuid) {
      query.site_uuid = requestedSiteUuid;
    } else if (effectiveRole === 'TENANT_ADMIN') {
      query.site_uuid = req.user.site_uuid;
    }

    const agents = await Summary.distinct('agent_uuid', query);
    // Extra safety: filter any remaining null values from result
    const cleanAgents = agents.filter(a => a != null && a !== '');
    res.json({ ok: true, count: cleanAgents.length, agents: cleanAgents });
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

    const requestedSiteUuid = req.headers['x-backone-site-uuid'];
    const isGlobalUser = req.user?.role === 'SUPER_ADMIN' ||
      req.user?.role === 'EXECUTIVE' ||
      ((!req.user?.site_uuid || req.user?.site_uuid === 'default') && ['SOC_ANALYST', 'ENGINEER'].includes(req.user?.role));
    
    let siteUuid = null;
    if (isGlobalUser && requestedSiteUuid) {
      siteUuid = requestedSiteUuid;
    } else if (req.user?.site_uuid) {
      siteUuid = req.user.site_uuid;
    }

    const { agentSizesCache, lastCacheUpdate } = require('../../db/capacityTracker');
    const allStorage = agentSizesCache();
    const cachedAt = lastCacheUpdate();

    let storage = allStorage;
    if (siteUuid) {
      const registryAgents = await mongoose.connection.db.collection('agent_registry')
        .find({ site_uuid: siteUuid })
        .toArray();
      const siteAgentUuids = new Set(registryAgents.map(a => a.uuid));

      const summaryAgents = await Summary.distinct('agent_uuid', { site_uuid: siteUuid });
      summaryAgents.forEach(uuid => {
        if (uuid) siteAgentUuids.add(uuid);
      });

      storage = {};
      Object.keys(allStorage).forEach(uuid => {
        if (siteAgentUuids.has(uuid)) {
          storage[uuid] = allStorage[uuid];
        }
      });
    }

    res.json({ ok: true, storage, cached_at: cachedAt });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});



// ─── GET /api/dashboard/agents/list ──────────────────────────────────────────
// Lightweight endpoint: kembalikan list agents (uuid + label) untuk user saat ini
// Digunakan frontend untuk lookup label agent pada View-As banner
router.get('/agents/list', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const user = req.user;
    
    const companyRoles = ['COMPANY_ADMIN', 'COMPANY_OPERATOR', 'COMPANY_VIEWER'];
    const isCompanyRole = companyRoles.includes(user?.role);
    
    let filter = {};
    
    if (isCompanyRole) {
      // Company roles: hanya kembalikan agent yang di-assign ke user
      const agentUuids = user?.agent_uuids || [];
      if (agentUuids.length === 0) {
        return res.json({ ok: true, data: [] });
      }
      filter.uuid = { $in: agentUuids };
    } else {
      // Admin/SUPER_ADMIN: filter berdasarkan site UUID dari header
      const requestedSiteUuid = req.headers['x-backone-site-uuid'];
      if (requestedSiteUuid) filter.site_uuid = requestedSiteUuid;
      else if (user?.site_uuid) filter.site_uuid = user.site_uuid;
    }
    
    const agents = await db.collection('agent_registry')
      .find(filter)
      .project({ uuid: 1, label: 1, _id: 0 })
      .sort({ uuid: 1 })
      .toArray();
    
    res.json({ ok: true, data: agents });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
