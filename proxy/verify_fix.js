// verify_fix.js - Directly verify the MongoDB aggregation returns correct results
// This simulates what the backend metadata-detail endpoint does after the fix.
// Run: node proxy/verify_fix.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/backone');
  const db = mongoose.connection.db;
  const col = db.collection('devicestats');

  const testValues = ['10.6.10.44'];
  // Also find other common device_labels to test
  const sample = await col.find({}).limit(20).toArray();
  const labels = [...new Set(sample.map(d => d.device_label).filter(Boolean))];
  console.log('Sample device_labels to test:', labels.slice(0, 5));

  for (const value of [...testValues, ...labels.slice(0, 3)]) {
    // Count raw docs matching
    const rawCount = await col.countDocuments({ device_label: value });
    
    // Simulate the new aggregation pipeline
    const aggResult = await col.aggregate([
      { $match: { device_label: value } },
      { $sort: { timestamp: -1 } },
      { $group: {
          _id: '$ip_address',
          mac_address:  { $first: '$mac_address' },
          device_label: { $first: '$device_label' },
          download:     { $max:   '$download' },
          upload:       { $max:   '$upload' },
      }},
      { $sort: { download: -1 } },
    ]).toArray();

    const status = rawCount > aggResult.length ? '✅ FIXED (was duplicated)' : '✓ OK';
    console.log(`\ndevice_label="${value}": raw=${rawCount} rows → aggregated=${aggResult.length} unique devices ${status}`);
    if (aggResult.length > 0) {
      console.log('  First result:', JSON.stringify(aggResult[0], null, 2));
    }
  }

  // Verify unique index exists
  const indexes = await col.indexes();
  const uniqueIdx = indexes.find(i => i.unique && i.key.agent_uuid && i.key.ip_address);
  console.log('\n=== Unique Index on (agent_uuid, ip_address):', uniqueIdx ? `✅ EXISTS (${uniqueIdx.name})` : '❌ MISSING');

  // Final count
  const total = await col.countDocuments();
  console.log('=== Total DeviceStat docs:', total);

  await mongoose.disconnect();
}

run().catch(err => { console.error(err.message); process.exit(1); });
