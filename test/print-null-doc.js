const mongoose = require('mongoose');

async function main() {
  const LOCAL_URI = 'mongodb://127.0.0.1:27017/backone_dpi';
  await mongoose.connect(LOCAL_URI);
  const db = mongoose.connection.db;
  
  const doc = await db.collection('summaries').findOne({
    $or: [
      { agent_uuid: null },
      { agent_uuid: '' },
      { agent_uuid: { $exists: false } }
    ]
  });
  
  console.log('Document with null/empty agent_uuid:');
  console.log(JSON.stringify(doc, null, 2));
  
  await mongoose.disconnect();
}
main();
