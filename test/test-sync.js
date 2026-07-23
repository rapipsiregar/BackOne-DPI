const proxyMongoose = require('../proxy/node_modules/mongoose');
require('dotenv').config({ path: './.env.local' });
const { syncApplicationDictionary } = require('../proxy/netifyClient');
const { LookupApp } = require('../proxy/models/Schemas');

async function test() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/backone_dpi';
  console.log('Connecting Proxy Mongoose to:', uri);
  await proxyMongoose.connect(uri);
  console.log('Connected to DB:', proxyMongoose.connection.name);
  
  await syncApplicationDictionary();
  
  const count = await LookupApp.countDocuments();
  console.log('Total LookupApps in DB inside test:', count);
  const sample = await LookupApp.findOne({}).lean();
  console.log('Sample LookupApp document:', sample);
  
  await proxyMongoose.disconnect();
}

test().catch(console.error);
