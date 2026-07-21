// proxy/routes.js
// ─── REST API Routes for BackOne Proxy Server ───────────────────────────────
const express   = require('express');
const router    = express.Router();
const mongoose  = require('mongoose');
const scheduler = require('./scheduler');

/**
 * GET /health
 * Liveness check
 */
router.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbLabel = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown';
  res.json({
    ok:      dbState === 1,
    service: 'BackOne Proxy Server',
    db:      dbLabel,
    mode:    process.env.PROXY_COLLECT_MODE || 'all',
    time:    new Date().toISOString(),
  });
});

/**
 * GET /status
 * Full scheduler + DB status
 */
router.get('/status', (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    ok:       true,
    db_state: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown',
    ...scheduler.getStatus(),
    time: new Date().toISOString(),
  });
});

/**
 * POST /collect/all
 * Manual trigger — collect ALL agents sekarang
 */
router.post('/collect/all', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ ok: false, error: 'MongoDB not connected. Cannot collect.' });
  }
  const { collectAllAgents } = require('./collector');
  console.log('[Proxy API] Manual trigger: collect ALL agents');
  try {
    const result = await collectAllAgents();
    res.json({ ok: result.success, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /collect/:agentUuid
 * Manual trigger — collect ONE specific agent
 */
router.post('/collect/:agentUuid', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ ok: false, error: 'MongoDB not connected. Cannot collect.' });
  }
  const { agentUuid } = req.params;
  const { collectSpecificAgent } = require('./collector');
  console.log(`[Proxy API] Manual trigger: collect agent ${agentUuid}`);
  try {
    const result = await collectSpecificAgent(agentUuid);
    res.json({ ok: result.success, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /collect/agents
 * Manual trigger — collect multiple specific agents
 * Body: { "uuids": ["uuid1", "uuid2", ...], "delay_ms": 5000 }
 */
router.post('/collect/agents', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ ok: false, error: 'MongoDB not connected. Cannot collect.' });
  }
  const { uuids, delay_ms } = req.body;
  if (!uuids || !Array.isArray(uuids) || uuids.length === 0) {
    return res.status(400).json({ ok: false, error: 'Body must include "uuids" as a non-empty array of agent UUIDs.' });
  }
  const { collectSpecificAgents } = require('./collector');
  console.log(`[Proxy API] Manual trigger: collect agents ${uuids.join(', ')}`);
  try {
    const result = await collectSpecificAgents(uuids, delay_ms || 5000);
    res.json({ ok: result.success, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /agents
 * List all agent UUIDs yang sudah tersimpan di MongoDB
 */
router.get('/agents', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ ok: false, error: 'MongoDB not connected.' });
    }
    const { Summary } = require('./models/Schemas');
    const agents = await Summary.distinct('agent_uuid');
    res.json({ ok: true, data: agents });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /domain-details
 * Fetch live IP/MAC details for a specific domain from MongoDB
 */
router.get('/domain-details', async (req, res) => {
  const { domain, agentUuid } = req.query;
  if (!domain) return res.status(400).json({ ok: false, error: 'domain is required' });
  
  try {
    const { Flow, DeviceStat } = require('./models/Schemas');
    
    const filter = { domain: domain };
    if (agentUuid) {
      filter.agent_uuid = agentUuid;
    }
    
    const raw = await Flow.find(filter).sort({ timestamp: -1 }).limit(100).lean();
    if (!raw || !Array.isArray(raw)) {
      return res.json({ ok: true, data: [] });
    }

    const results = [];
    const seen = new Set();
    
    for (const r of raw) {
      const ip = r.src_ip;
      const mac = r.src_mac;
      if (!ip || !mac) continue;
      
      const key = `${ip}-${mac}`;
      if (seen.has(key)) continue;
      seen.add(key);

      let deviceName = 'Unknown Device';
      try {
        const dev = await DeviceStat.findOne({ mac_address: mac }).sort({ timestamp: -1 });
        if (dev && dev.name && dev.name !== 'Unknown Device') {
          deviceName = dev.name;
        }
      } catch (e) {
        // ignore timeout errors
      }

      results.push({
        ip,
        mac,
        deviceName,
        lastSeen: r.timestamp || r.last_seen || r.first_seen,
      });
    }

    res.json({ ok: true, data: results });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /latest
 * Tampilkan data terbaru dari semua collection (untuk debug)
 */
router.get('/latest', async (req, res) => {
  try {
    const { Summary, AppStat, DeviceStat, Flow, Threat, Event, AppCategoryStat } = require('./models/Schemas');
    const [summary, apps, devices, flows, threats, events, categories] = await Promise.all([
      Summary.findOne().sort({ timestamp: -1 }).lean(),
      AppStat.find().sort({ timestamp: -1 }).limit(5).lean(),
      DeviceStat.find().sort({ timestamp: -1 }).limit(5).lean(),
      Flow.find().sort({ timestamp: -1 }).limit(5).lean(),
      Threat.find().sort({ timestamp: -1 }).limit(5).lean(),
      Event.find().sort({ timestamp: -1 }).limit(5).lean(),
      AppCategoryStat.find().sort({ timestamp: -1 }).limit(5).lean(),
    ]);
    res.json({ ok: true, data: { summary, apps, devices, flows, threats, events, categories } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
