// check_device.js - Detailed check of 10.6.10.44 records
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/backone');
  const db = mongoose.connection.db;
  
  // Get all records for 10.6.10.44
  const docs = await db.collection('devicestats')
    .find({ ip_address: '10.6.10.44' })
    .sort({ timestamp: 1 })
    .toArray();
  
  console.log(`Total docs for 10.6.10.44: ${docs.length}`);
  docs.forEach((d, i) => {
    console.log(`\n--- Doc ${i + 1} ---`);
    console.log('  _id:        ', d._id);
    console.log('  agent_uuid: ', d.agent_uuid);
    console.log('  timestamp:  ', d.timestamp);
    console.log('  created_at: ', d.created_at);
    console.log('  updated_at: ', d.updated_at);
    console.log('  download:   ', d.download);
    console.log('  device_label:', d.device_label);
  });
  
  // Check if there are different agent_uuids
  const agents = [...new Set(docs.map(d => d.agent_uuid))];
  console.log('\nDistinct agent_uuids for this IP:', agents);
  
  await mongoose.disconnect();
}
run().catch(err => { console.error(err.message); process.exit(1); });
