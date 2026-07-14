// proxy/index.js
// ─────────────────────────────────────────────────────────────────────────────
// BackOne Proxy Server - Entry Point
// ─────────────────────────────────────────────────────────────────────────────

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const express   = require('express');
const cors      = require('cors');
const mongoose  = require('mongoose');
const scheduler = require('./scheduler');
const routes    = require('./routes');

const PORT        = parseInt(process.env.PROXY_PORT || '4000');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/backone_dpi';

// Connect to MongoDB with automated retries
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
      logCapacityStats('[MongoDB]').catch(err => console.warn('[MongoDB] Capacity log failed:', err.message));
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
  return false;
}

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));
app.use('/', routes); // Mount extracted routes

async function main() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║        BackOne Proxy Server - Starting         ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  console.log(`[Proxy] Mode: ${process.env.PROXY_COLLECT_MODE || 'all'}`);
  
  // Start REST API server first so liveness probes remain active
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Proxy REST API running at http://0.0.0.0:${PORT}`);
    console.log(`   GET  /health   → liveness check`);
    console.log(`   GET  /status   → scheduler + DB status\n`);
  });

  const connected = await connectDB();

  if (connected) {
    scheduler.startScheduler();
    console.log('\n[Proxy] ✓ Scheduler started. Data collection is active.\n');
  } else {
    console.error('\n[Proxy] ✗ Could not connect to MongoDB. Scheduler NOT started.\n');
  }
}

main().catch(err => {
  console.error('[Proxy] Fatal startup error:', err);
});
