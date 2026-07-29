const mongoose = require('mongoose');
require('dotenv').config({path: '../.env.local'});
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection;
  const threats = await db.collection('threats').countDocuments();
  const events = await db.collection('events').countDocuments();
  const highEvents = await db.collection('events').countDocuments({
    $or: [
      {severity: {$in: ['Critical', 'High']}}, 
      {category_label: 'Cybersecurity'}
    ]
  });
  console.log({threats, events, highEvents});
  process.exit(0);
}).catch(e => console.error(e));
