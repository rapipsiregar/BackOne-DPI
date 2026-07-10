// backend/routes/dashboard.js
// ─────────────────────────────────────────────────────────────────────────────
// BackOne Dashboard Routes Entry Point
// Mounts all modular sub-routers under /api/dashboard.
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const axios   = require('axios');

const PROXY_URL = process.env.PROXY_URL || 'http://localhost:4000';

// ─── Rebranding Middleware ────────────────────────────────────────────────────
router.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (body) {
      try {
        const sanitized = JSON.stringify(body)
          .replace(/netify\.unclassified/gi, 'backone.unclassified')
          .replace(/netify\.(?!ai)/gi, 'backone.')
          .replace(/Netify's/g, "BackOne's")
          .replace(/netify's/g, "backone's")
          .replace(/Netify(?!(\.ai))/g, 'BackOne')
          .replace(/netify(?!(\.ai))/g, 'backone');
        body = JSON.parse(sanitized);
      } catch (err) {
        console.error('[Dashboard] Rebrand error:', err.message);
      }
    }
    return originalJson(body);
  };
  next();
});

// POST /api/dashboard/refresh
router.post('/refresh', async (req, res) => {
  try {
    const response = await axios.post(`${PROXY_URL}/collect/all`, {}, { timeout: 10000 });
    res.json({ ok: true, message: 'Collection triggered on proxy.', proxy_result: response.data });
  } catch (err) {
    console.warn('[/refresh] Proxy not reachable:', err.message);
    res.json({ ok: false, message: 'Could not reach proxy server. Data will be updated on next scheduled run.', error: err.message });
  }
});

// Mount Sub-routers
router.use(require('./dashboard/summary'));
router.use(require('./dashboard/agents'));
router.use(require('./dashboard/apps'));
router.use(require('./dashboard/devices'));
router.use(require('./dashboard/flows'));
router.use(require('./dashboard/threats'));
router.use(require('./dashboard/geo'));
router.use(require('./dashboard/tls'));
router.use(require('./dashboard/telemetry'));
router.use(require('./dashboard/events'));
router.use(require('./dashboard/sslSan'));

module.exports = router;
