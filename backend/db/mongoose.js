// backend/db/mongoose.js
// Connects the backend to MongoDB.
// The backend is READ-ONLY — all writes are done by the proxy server.
// MongoDB URI is provided via MONGODB_URI environment variable.

const mongoose = require('mongoose');
const path = require('path');
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
require('dotenv').config({ path: path.join(__dirname, '../../', envFile) });

if (!process.env.MONGODB_URI) {
  console.error('[MongoDB] ❌ CRITICAL ERROR: MONGODB_URI environment variable is missing.');
  console.error('[MongoDB] Local database is disabled. Connection to central database backone_dpi is required.');
  process.exit(1);
}
const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return; // already connected

  const MAX_RETRIES = 5;
  const RETRY_DELAY = 5000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[MongoDB] Connecting... (attempt ${attempt}/${MAX_RETRIES})`);
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
      console.log('[MongoDB] ✓ Connected successfully to', MONGODB_URI);
      const { logCapacityStats } = require('./capacityTracker');
      logCapacityStats('[MongoDB]').catch(err => console.warn('[MongoDB] Capacity log failed:', err.message));
      return;
    } catch (error) {
      console.error(`[MongoDB] ✗ Attempt ${attempt} failed: ${error.message}`);
      if (attempt < MAX_RETRIES) {
        console.log(`[MongoDB] Retrying in ${RETRY_DELAY / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }

  console.error('[MongoDB] All connection attempts failed. Backend cannot serve dashboard data.');
  // Do NOT exit — allow health check endpoint to remain available
}

module.exports = connectDB;
