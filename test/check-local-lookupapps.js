require('dotenv').config({ path: './.env.local' });
const mongoose = require('mongoose');
const { LookupApp } = require('../proxy/models/Schemas');

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/backone_dpi';
  console.log('Using URI from env:', uri);
  await mongoose.connect(uri);
  console.log('Connected to:', mongoose.connection.name, 'on host:', mongoose.connection.host);
  
  const count = await LookupApp.countDocuments({});
  console.log('LookupApp model count:', count);
  
  const rawCount = await mongoose.connection.db.collection('lookupapps').countDocuments({});
  console.log('Raw collection count:', rawCount);
  
  await mongoose.disconnect();
}

main().catch(console.error);
