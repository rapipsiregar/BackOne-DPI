// proxy/clean_devicestat_duplicates.js
// ─────────────────────────────────────────────────────────────────────────────
// One-time cleanup script to deduplicate historical DeviceStat records.
// Keeps only the LATEST document per (agent_uuid, ip_address) pair,
// removing all older duplicates accumulated before the upsert fix.
//
// Usage: node proxy/clean_devicestat_duplicates.js
// ─────────────────────────────────────────────────────────────────────────────

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/backone';

const DeviceStatSchema = new mongoose.Schema({
  timestamp:    { type: Date },
  agent_uuid:   { type: String },
  site_uuid:    { type: String },
  ip_address:   { type: String },
  mac_address:  { type: String },
  device_label: String,
  device_type:  String,
  os_label:     String,
  manufacturer: String,
  download:     Number,
  upload:       Number,
  flows:        Number,
  last_seen:    String,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const DeviceStat = mongoose.model('DeviceStat', DeviceStatSchema);

async function run() {
  console.log('[Cleanup] Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('[Cleanup] Connected.');

  // Find all unique (agent_uuid, ip_address) combinations
  const groups = await DeviceStat.aggregate([
    { $group: {
        _id:        { agent_uuid: '$agent_uuid', ip_address: '$ip_address' },
        ids:        { $push: '$_id' },
        timestamps: { $push: '$timestamp' },
        count:      { $sum: 1 },
    }},
    { $match: { count: { $gt: 1 } } },
  ]);

  console.log(`[Cleanup] Found ${groups.length} (agent_uuid, ip_address) pairs with duplicates.`);
  let totalDeleted = 0;

  for (const group of groups) {
    // Sort the ids by matching timestamps - keep the latest
    const paired = group.ids.map((id, i) => ({ id, ts: group.timestamps[i] }));
    paired.sort((a, b) => new Date(b.ts) - new Date(a.ts));

    // Keep the first (newest), delete the rest
    const toDelete = paired.slice(1).map(p => p.id);
    const result = await DeviceStat.deleteMany({ _id: { $in: toDelete } });
    totalDeleted += result.deletedCount;
  }

  const remaining = await DeviceStat.countDocuments();
  console.log(`[Cleanup] Done. Deleted ${totalDeleted} duplicate DeviceStat records.`);
  console.log(`[Cleanup] Remaining DeviceStat documents: ${remaining}`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('[Cleanup] Fatal error:', err.message);
  process.exit(1);
});
