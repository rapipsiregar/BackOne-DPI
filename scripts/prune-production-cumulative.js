// scripts/prune-production-cumulative.js
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/backone_dpi";

async function run() {
  console.log('Connecting to Production MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const db = mongoose.connection.db;

  // We want to delete summaries and telemetry documents created before today at 18:40 WIB (11:40 UTC)
  const cutOffDate = new Date('2026-07-23T11:40:00.000Z');
  console.log('Pruning data before:', cutOffDate);

  const collections = ['summaries', 'appstats', 'protocolstats', 'devicestats'];
  
  for (const collName of collections) {
    const countBefore = await db.collection(collName).countDocuments({});
    console.log(`[${collName}] Count before prune:`, countBefore);

    const deleteRes = await db.collection(collName).deleteMany({
      timestamp: { $lt: cutOffDate }
    });
    console.log(`[${collName}] Deleted:`, deleteRes.deletedCount);

    const countAfter = await db.collection(collName).countDocuments({});
    console.log(`[${collName}] Count after prune:`, countAfter);
  }

  await mongoose.disconnect();
  console.log('✓ Pruning complete!');
}

run().catch(console.error);
