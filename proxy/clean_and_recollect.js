const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');
const { collectAllAgents } = require('./collector');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/backone_dpi';

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const db = mongoose.connection.db;
  const collections = ['devicestats', 'deviceappstats', 'appstats'];

  console.log('Clearing old contaminated collections...');
  for (const colName of collections) {
    await db.collection(colName).deleteMany({});
    console.log(`  ✓ Cleared ${colName}`);
  }

  console.log('\nRunning initial data collection cycle for ALL agents...');
  const result = await collectAllAgents();
  console.log('Collection completed:', JSON.stringify(result, null, 2));

  // Log new clean sizes
  const { logCapacityStats } = require('./db/capacityTracker');
  await logCapacityStats('[MongoDB] Capacity after clean run:');

  await mongoose.disconnect();
  console.log('Done.');
  process.exit(0);
}

run().catch(e => {
  console.error('Fatal error during clean and recollect:', e);
  process.exit(1);
});
