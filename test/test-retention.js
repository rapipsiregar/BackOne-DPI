const proxyMongoose = require('../proxy/node_modules/mongoose');
require('dotenv').config({ path: './.env.local' });
const { LookupApp } = require('../proxy/models/Schemas');

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/backone_dpi';
  await proxyMongoose.connect(uri);
  
  console.log('Count at start:', await LookupApp.countDocuments({}));
  
  console.log('Sleeping for 10 seconds...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  console.log('Count after 10 seconds:', await LookupApp.countDocuments({}));
  
  await proxyMongoose.disconnect();
}

main().catch(console.error);
