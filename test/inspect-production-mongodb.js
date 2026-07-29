// test/inspect-production-mongodb.js
const mongoose = require('c:/Users/demo/Downloads/Deep Package Inspection/backend/node_modules/mongoose');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/backone_dpi";

async function run() {
  console.log('Connecting to Production MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const db = mongoose.connection.db;
  const count = await db.collection('summaries').countDocuments({});
  console.log('Total summaries documents in DB:', count);

  // Find latest documents
  console.log('--- LATEST 5 DOCUMENTS ---');
  const latest = await db.collection('summaries').find({}).sort({ timestamp: -1 }).limit(5).toArray();
  for (const doc of latest) {
    console.log(`ID: ${doc._id}, Time: ${doc.timestamp}, Agent: ${doc.agent_uuid}, Site: ${doc.site_uuid}, Down: ${doc.bandwidth_down}, Up: ${doc.bandwidth_up}, Flows: ${doc.active_flows}`);
  }

  // Find site-level summaries in last 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600000);
  const siteSummaries = await db.collection('summaries').find({
    agent_uuid: null,
    timestamp: { $gte: twentyFourHoursAgo }
  }).toArray();
  console.log('--- SITE-LEVEL SUMMARIES IN LAST 24 HOURS ---');
  console.log('Count:', siteSummaries.length);

  const massiveDocs = siteSummaries.filter(d => (d.bandwidth_down || 0) > 1e9);
  console.log('Number of documents with Down > 1 GB:', massiveDocs.length);
  for (const doc of massiveDocs.slice(0, 10)) {
    console.log(`ID: ${doc._id}, Time: ${doc.timestamp}, Down: ${doc.bandwidth_down}`);
  }

  if (siteSummaries.length > 0) {
    let sumDown = 0;
    let sumUp = 0;
    for (const doc of siteSummaries) {
      sumDown += (doc.bandwidth_down || 0);
      sumUp += (doc.bandwidth_up || 0);
    }
    console.log(`Total Download (Sum): ${sumDown} bytes (${(sumDown / 1e12).toFixed(2)} TB)`);
    console.log(`Total Upload (Sum): ${sumUp} bytes (${(sumUp / 1e12).toFixed(2)} TB)`);
    console.log(`Average Flows: ${siteSummaries[0].active_flows}`);
    console.log('Sample Document from last 24 hours:');
    console.log(JSON.stringify(siteSummaries[0], null, 2));
  }

  await mongoose.disconnect();
}

run().catch(console.error);
