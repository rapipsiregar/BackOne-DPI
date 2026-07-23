const rootMongoose = require('mongoose');
const proxyMongoose = require('../proxy/node_modules/mongoose');
const { LookupApp } = require('../proxy/models/Schemas');

async function main() {
  const uri = 'mongodb://127.0.0.1:27017/backone_dpi';
  console.log('Connecting Root Mongoose...');
  await rootMongoose.connect(uri);
  console.log('Root Mongoose connection state:', rootMongoose.connection.readyState);
  console.log('Proxy Mongoose connection state BEFORE:', proxyMongoose.connection.readyState);
  
  try {
    const count = await LookupApp.countDocuments({});
    console.log('Count from LookupApp:', count);
  } catch (err) {
    console.log('Error counting from LookupApp:', err.message);
  }
  
  console.log('Connecting Proxy Mongoose...');
  await proxyMongoose.connect(uri);
  console.log('Proxy Mongoose connection state AFTER:', proxyMongoose.connection.readyState);
  
  try {
    const count = await LookupApp.countDocuments({});
    console.log('Count from LookupApp after proxy connect:', count);
  } catch (err) {
    console.log('Error counting from LookupApp after proxy connect:', err.message);
  }
  
  await rootMongoose.disconnect();
  await proxyMongoose.disconnect();
}

main().catch(console.error);
