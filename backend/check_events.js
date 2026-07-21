const mongoose = require('mongoose');
require('dotenv').config({path: '../.env.local'});
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection;
  const highEvents = await db.collection('events').find({
    $or: [
      {severity: {$in: ['Critical', 'High']}}, 
      {category_label: 'Cybersecurity'}
    ]
  }).toArray();
  
  if (highEvents.length > 0) {
     console.log("High Events timestamps:");
     highEvents.forEach(e => {
        console.log("- event_at:", e.event_at, " | timestamp:", e.timestamp);
     });
  } else {
     console.log("No high events found in array");
  }

  process.exit(0);
}).catch(e => console.error(e));
