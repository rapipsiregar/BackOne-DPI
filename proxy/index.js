// proxy/index.js
// ─────────────────────────────────────────────────────────────────────────────
// BackOne Proxy Server - Entry Point
//
// Responsibilities:
//   1. Connect to MongoDB (dengan retry otomatis)
//   2. Start DPI data collection scheduler (setiap 5 menit)
//   3. Expose REST API untuk manual trigger dan health check
//   4. Lakukan immediate collect saat startup (tidak perlu tunggu cron pertama)
//
// Environment Variables:
//   MONGODB_URI          - MongoDB connection string (default: localhost:27017)
//   PROXY_COLLECT_MODE   - 'all' (default) | 'agent' | 'agents'
//   PROXY_AGENT_UUID     - Required if PROXY_COLLECT_MODE=agent
//   PROXY_AGENT_UUIDS    - Comma-separated list of agent UUIDs, required if PROXY_COLLECT_MODE=agents
//   PROXY_AGENT_DELAY_MS - Delay between agent collections in ms (default: 5000)
//   PROXY_CRON_SCHEDULE  - Default: '*/5 * * * *' (setiap 5 menit)
//   PROXY_PORT           - Port untuk REST API (default: 4000)
// ─────────────────────────────────────────────────────────────────────────────

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const express   = require('express');
const cors      = require('cors');
const mongoose  = require('mongoose');
const scheduler = require('./scheduler');

const PORT        = parseInt(process.env.PROXY_PORT || '4000');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/backone_dpi';

// ─── Connect to MongoDB (retry-based, tidak exit prematurely) ──────────────────
async function connectDB() {
  const MAX_RETRIES  = 10;
  const RETRY_DELAYS = [2000, 3000, 5000, 5000, 10000, 10000, 10000, 15000, 15000, 30000];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[MongoDB] Connection attempt ${attempt}/${MAX_RETRIES} → ${MONGODB_URI}`);
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS:         8000,
        socketTimeoutMS:          30000,
      });
      console.log('[MongoDB] ✓ Connected successfully to', MONGODB_URI);
      const { logCapacityStats } = require('./db/capacityTracker');
      await logCapacityStats('[MongoDB]');
      return true;
    } catch (err) {
      console.error(`[MongoDB] ✗ Attempt ${attempt} failed: ${err.message}`);
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt - 1] || 15000;
        console.log(`[MongoDB] Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error('[MongoDB] All connection attempts failed. Check if MongoDB is running on', MONGODB_URI);
  console.error('[MongoDB] Proxy REST API will still run. Fix MongoDB and restart.');
  return false;
}

// ─── REST API ──────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use(cors({ origin: '*' })); // Proxy hanya dikonsumsi oleh backend, open CORS ok

/**
 * GET /health
 * Liveness check
 */
app.get('/health', (req, res) => {
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
app.get('/status', (req, res) => {
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
app.post('/collect/all', async (req, res) => {
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
app.post('/collect/:agentUuid', async (req, res) => {
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
app.post('/collect/agents', async (req, res) => {
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
app.get('/agents', async (req, res) => {
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
 * Fetch live IP/MAC details for a specific domain from Netify API
 * Fetch live IP/MAC details for a specific domain from MongoDB
 */
app.get('/domain-details', async (req, res) => {
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
app.get('/latest', async (req, res) => {
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

// ─── Boot Sequence ─────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║        BackOne Proxy Server - Starting         ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  console.log(`[Proxy] Mode: ${process.env.PROXY_COLLECT_MODE || 'all'}`);
  if (process.env.PROXY_COLLECT_MODE === 'agent') {
    console.log(`[Proxy] Agent UUID: ${process.env.PROXY_AGENT_UUID || '(not set!)'}`);
  }
  if (process.env.PROXY_COLLECT_MODE === 'agents') {
    const agents = (process.env.PROXY_AGENT_UUIDS || '').split(',').map(s => s.trim()).filter(Boolean);
    console.log(`[Proxy] Agent UUIDs: ${agents.length > 0 ? agents.join(', ') : '(not set!)'}`);
    console.log(`[Proxy] Agent delay: ${parseInt(process.env.PROXY_AGENT_DELAY_MS || '5000')}ms`);
  }

  // 1. Start REST API server FIRST (so /health is always available)
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Proxy REST API running at http://0.0.0.0:${PORT}`);
    console.log(`   GET  /health   → liveness check`);
    console.log(`   GET  /status   → scheduler + DB status`);
    console.log(`   GET  /agents   → list agent UUIDs in MongoDB`);
    console.log(`   POST /collect/all        → trigger manual collect all`);
    console.log(`   POST /collect/:agentUuid → trigger manual collect specific`);
    console.log(`   POST /collect/agents     → trigger manual collect multiple\n`);
  });

  // 2. Connect to MongoDB (retry in background)
  const connected = await connectDB();

  // 3. Start scheduler only if DB connected
  if (connected) {
    scheduler.startScheduler();
    console.log('\n[Proxy] ✓ Scheduler started. Data collection is active.');
    console.log('[Proxy] ✓ First collection will run in 2 seconds after MongoDB is ready.\n');
  } else {
    console.error('\n[Proxy] ✗ Could not connect to MongoDB. Scheduler NOT started.');
    console.error('[Proxy] ✗ To fix: ensure MongoDB is running at', MONGODB_URI);
    console.error('[Proxy] ✗ Then restart the proxy server.\n');
  }
}

main().catch(err => {
  console.error('[Proxy] Fatal startup error:', err);
  // Don't exit — let REST API still serve /health
});
