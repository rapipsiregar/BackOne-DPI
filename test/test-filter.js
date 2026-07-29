const mongoose = require('mongoose');

async function main() {
  const LOCAL_URI = 'mongodb://127.0.0.1:27017/backone_dpi';
  await mongoose.connect(LOCAL_URI);
  const db = mongoose.connection.db;
  
  const filter = { agent_uuid: { $ne: null } };
  
  const results = await db.collection('summaries')
    .aggregate([
      { $match: filter },
      { $sort: { timestamp: -1 } },
      { $group: { _id: '$agent_uuid', lastSeen: { $first: '$timestamp' }, label: { $first: '$agent_label' } } },
    ]).toArray();
    
  console.log('Aggregated agents without site filter:', results);
  await mongoose.disconnect();
}
main();
