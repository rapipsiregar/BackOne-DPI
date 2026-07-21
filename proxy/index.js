// proxy/index.js
// ─────────────────────────────────────────────────────────────────────────────
// Polyfill global crypto for Node 18 compatibility (required by mongodb driver)
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = require('crypto');
}

// BackOne Proxy Server - Entry Point
// ─────────────────────────────────────────────────────────────────────────────

const path = require('path');
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
require('dotenv').config({ path: path.join(__dirname, '..', envFile) });

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
  
  // Bind to 127.0.0.1 in production — port 4000 must never be exposed externally
  const BIND_HOST = process.env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0';
  app.listen(PORT, BIND_HOST, () => {
    console.log(`\n🚀 Proxy REST API running at http://${BIND_HOST}:${PORT}`);
    console.log(`   GET  /health   → liveness check`);
    console.log(`   GET  /status   → scheduler + DB status`);
    console.log(`🔒 Security   : Bound to ${BIND_HOST} (internal only in production)\n`);
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
