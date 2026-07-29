const mongoose = require('mongoose');

async function main() {
  const LOCAL_URI = 'mongodb://127.0.0.1:27017/backone_dpi';
  await mongoose.connect(LOCAL_URI);
  const db = mongoose.connection.db;
  
  console.log('--- Summaries with null/empty agent_uuid ---');
  const nullSummaries = await db.collection('summaries').find({
    $or: [
      { agent_uuid: null },
      { agent_uuid: '' },
      { agent_uuid: { $exists: false } }
    ]
  }).toArray();
  
  console.log(`Found ${nullSummaries.length} documents:`);
  nullSummaries.forEach(s => {
    console.log(`_id: ${s._id}, timestamp: ${s.timestamp}, site_uuid: ${s.site_uuid}, agent_label: ${s.agent_label}`);
  });
  
  await mongoose.disconnect();
}
main();
