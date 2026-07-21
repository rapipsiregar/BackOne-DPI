const mongoose = require('mongoose');
require('dotenv').config({path: '../.env.local'});
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection;
  const threats = await db.collection('threats').aggregate([{ $group: { _id: '$threat_type', count: { $sum: 1 } } }]).toArray();
  console.log('Threat types:', threats);
  const events = await db.collection('events').aggregate([{ $group: { _id: '$event_type', count: { $sum: 1 } } }]).toArray();
  console.log('Event types:', events);
  process.exit(0);
});
