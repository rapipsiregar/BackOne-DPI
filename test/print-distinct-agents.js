const mongoose = require('mongoose');

async function main() {
  const LOCAL_URI = 'mongodb://127.0.0.1:27017/backone_dpi';
  await mongoose.connect(LOCAL_URI);
  const db = mongoose.connection.db;
  
  const distinctUuids = await db.collection('summaries').distinct('agent_uuid');
  console.log('Distinct agent_uuid values in summaries:');
  console.log(distinctUuids.map(u => typeof u === 'string' ? `"${u}"` : u));
  
  await mongoose.disconnect();
}
main();
