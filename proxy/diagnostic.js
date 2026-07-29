// diagnostic.js - Run: node proxy/diagnostic.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/backone';

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  // 1. Total count
  const total = await db.collection('devicestats').countDocuments();
  console.log('=== DeviceStat Total:', total);

  // 2. Count for 10.6.10.44
  const specific = await db.collection('devicestats').countDocuments({ ip_address: '10.6.10.44' });
  console.log('=== Count for 10.6.10.44:', specific);

  // 3. Sample doc for 10.6.10.44
  const sample = await db.collection('devicestats').findOne({ ip_address: '10.6.10.44' });
  console.log('=== Sample doc for 10.6.10.44:', JSON.stringify(sample, null, 2));

  // 4. Duplicate groups (top 10)
  const dups = await db.collection('devicestats').aggregate([
    { $group: { _id: { agent_uuid: '$agent_uuid', ip_address: '$ip_address' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]).toArray();
  console.log('=== Top duplicate groups:', JSON.stringify(dups, null, 2));

  // 5. Check what collection name is actually used
  const collections = await db.listCollections().toArray();
  console.log('=== Collections:', collections.map(c => c.name));

  // 6. Check indexes on devicestats
  const indexes = await db.collection('devicestats').indexes();
  console.log('=== Indexes on devicestats:', JSON.stringify(indexes, null, 2));

  await mongoose.disconnect();
}

run().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
