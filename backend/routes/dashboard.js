// backend/routes/dashboard.js
// ─────────────────────────────────────────────────────────────────────────────
// BackOne Dashboard Routes Entry Point
// Mounts all modular sub-routers under /api/dashboard.
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const axios   = require('axios');

const PROXY_URL = process.env.PROXY_URL || 'http://localhost:4010';

// ─── Rebranding Helper (Memory Safe & Fast) ──────────────────────────────────
const BRAND_NAMES = {
  '1959bb55_045b_47c7_bbdd_f33b7db197b9': 'Office',
  '6681452d_9cae_4ff4_8ae8_0d504774265e': 'SIAB',
  'default': 'BackOne'
};

function getBrandNameForRequest(req) {
  const requestedSiteUuid = req.headers['x-backone-site-uuid'];
  const userSiteUuid = req.user?.site_uuid;
  
  const siteUuid = (req.user?.role === 'SUPER_ADMIN' || !userSiteUuid || userSiteUuid === 'default')
    ? (requestedSiteUuid || 'default')
    : userSiteUuid;

  return BRAND_NAMES[siteUuid] || 'BackOne';
}

function rebrandString(str, brandName) {
  if (typeof str !== 'string') return str;
  
  if (brandName === 'Nexus') {
    return str
      .replace(/netify\.unclassified/gi, 'nexus.unclassified')
      .replace(/netify\.(?!ai)/gi, 'nexus.')
      .replace(/Netify's/g, "Nexus'")
      .replace(/netify's/g, "nexus'")
      .replace(/Netify(?!(\.ai))/g, 'Nexus')
      .replace(/netify(?!(\.ai))/g, 'nexus')
      .replace(/BackOne's/g, "Nexus'")
      .replace(/backone's/g, "nexus'")
      .replace(/BackOne/g, 'Nexus')
      .replace(/backone/g, 'nexus')
      .replace(/PT\.?\s*Data\s*Bisnis\s*Solusi/g, 'PT. Nexus Solusi');
  } else if (brandName === 'SIAB') {
    return str
      .replace(/netify\.unclassified/gi, 'siab.unclassified')
      .replace(/netify\.(?!ai)/gi, 'siab.')
      .replace(/Netify's/g, "SIAB's")
      .replace(/netify's/g, "siab's")
      .replace(/Netify(?!(\.ai))/g, 'SIAB')
      .replace(/netify(?!(\.ai))/g, 'siab');
  }

  // Default (BackOne)
  return str
    .replace(/netify\.unclassified/gi, 'backone.unclassified')
    .replace(/netify\.(?!ai)/gi, 'backone.')
    .replace(/Netify's/g, "BackOne's")
    .replace(/netify's/g, "backone's")
    .replace(/Netify(?!(\.ai))/g, 'BackOne')
    .replace(/netify(?!(\.ai))/g, 'backone');
}

function rebrandObj(obj, brandName) {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = rebrandObj(obj[i], brandName);
    }
    return obj;
  }

  if (typeof obj === 'object') {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (typeof obj[key] === 'string') {
          obj[key] = rebrandString(obj[key], brandName);
        } else if (typeof obj[key] === 'object') {
          obj[key] = rebrandObj(obj[key], brandName);
        }
      }
    }
    return obj;
  }

  if (typeof obj === 'string') {
    return rebrandString(obj, brandName);
  }

  return obj;
}

// ─── Rebranding Middleware ────────────────────────────────────────────────────
router.use((req, res, next) => {
  const brandName = getBrandNameForRequest(req);
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (body) {
      try {
        body = rebrandObj(body, brandName);
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
router.use(require('./dashboard/deviceLabeling'));
router.use(require('./dashboard/flows'));
router.use(require('./dashboard/flowStats'));
router.use(require('./dashboard/threats'));
router.use(require('./dashboard/geo'));
router.use(require('./dashboard/tls'));
router.use(require('./dashboard/telemetry'));
router.use(require('./dashboard/events'));
router.use(require('./dashboard/sslSan'));
router.use(require('./dashboard/tenantConfig'));
router.use(require('./dashboard/agentLocations'));
router.use(require('./dashboard/blacklist'));

module.exports = router;
