// fix_devicestat_index.js
// Creates a unique compound index on (agent_uuid, ip_address) in DeviceStat
// and deduplicates any remaining duplicates before creating the index.
// Run: node proxy/fix_devicestat_index.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/backone';

async function run() {
  console.log('[Fix] Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const col = db.collection('devicestats');

  // Step 1: Find all duplicates grouped by (agent_uuid, ip_address)
  console.log('[Fix] Scanning for duplicates...');
  const groups = await col.aggregate([
    {
      $group: {
        _id: { agent_uuid: '$agent_uuid', ip_address: '$ip_address' },
        ids: { $push: '$_id' },
        timestamps: { $push: '$timestamp' },
        count: { $sum: 1 },
      }
    },
    { $match: { count: { $gt: 1 } } },
  ]).toArray();

  console.log(`[Fix] Found ${groups.length} duplicate groups.`);
  let deleted = 0;

  for (const group of groups) {
    // Sort by timestamp descending — keep the newest
    const paired = group.ids.map((id, i) => ({ id, ts: new Date(group.timestamps[i] || 0) }));
    paired.sort((a, b) => b.ts - a.ts);
    const toDelete = paired.slice(1).map(p => p.id);
    const result = await col.deleteMany({ _id: { $in: toDelete } });
    deleted += result.deletedCount;
  }

  console.log(`[Fix] Deleted ${deleted} duplicate documents.`);
  const remaining = await col.countDocuments();
  console.log(`[Fix] Remaining DeviceStat documents: ${remaining}`);

  // Step 2: Drop old non-unique compound index if it exists
  try {
    await col.dropIndex('agent_uuid_1_timestamp_-1_ip_address_1');
    console.log('[Fix] Dropped old compound index.');
  } catch (e) {
    console.log('[Fix] Old index not found or already dropped:', e.message);
  }

  // Step 3: Create UNIQUE compound index on (agent_uuid, ip_address)
  try {
    await col.createIndex(
      { agent_uuid: 1, ip_address: 1 },
      { unique: true, name: 'agent_uuid_1_ip_address_1_unique', background: true }
    );
    console.log('[Fix] Created unique index on (agent_uuid, ip_address).');
  } catch (e) {
    console.error('[Fix] Failed to create unique index:', e.message);
  }

  // Step 4: Verify indexes
  const indexes = await col.indexes();
  console.log('[Fix] Current indexes:');
  indexes.forEach(idx => console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '[UNIQUE]' : ''}`));

  // Step 5: Verify 10.6.10.44
  const cnt = await col.countDocuments({ ip_address: '10.6.10.44' });
  console.log(`\n[Fix] Count for 10.6.10.44: ${cnt} (should be 1)`);

  await mongoose.disconnect();
  console.log('[Fix] Done.');
}

run().catch(err => { console.error('[Fix] Fatal:', err.message); process.exit(1); });
