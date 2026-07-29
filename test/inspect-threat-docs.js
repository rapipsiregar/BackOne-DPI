const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.production') });

const { Threat, Event } = require('../backend/models/Schemas');

async function main() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected!');

  console.log('\n--- RAW THREAT DOCS ---');
  const threats = await Threat.find().lean();
  console.log(JSON.stringify(threats, null, 2));

  console.log('\n--- RAW EVENTS (Cybersecurity / High severity) ---');
  const events = await Event.find({
    $or: [
      { severity: { $in: ['Critical', 'High'] } },
      { category_label: 'Cybersecurity' }
    ]
  }).lean();
  console.log(JSON.stringify(events, null, 2));

  await mongoose.disconnect();
}

main().catch(console.error);
