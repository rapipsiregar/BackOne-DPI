const mongoose = require('mongoose');
const { LookupApp } = require('../backend/models/Schemas');

async function main() {
  const uri = 'mongodb://127.0.0.1:27017/backone_dpi';
  await mongoose.connect(uri);
  console.log('Connected to:', mongoose.connection.name);
  
  const count = await LookupApp.countDocuments({});
  console.log('LookupApp model count in backend schema:', count);
  
  await mongoose.disconnect();
}

main().catch(console.error);
