const proxyMongoose = require('../proxy/node_modules/mongoose');
require('dotenv').config({ path: './.env.local' });

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/backone_dpi';
  await proxyMongoose.connect(uri);
  console.log('--- CONNECTION DETAILS ---');
  console.log('Host:', proxyMongoose.connection.host);
  console.log('Port:', proxyMongoose.connection.port);
  console.log('DB Name:', proxyMongoose.connection.name);
  console.log('URI used:', uri);
  
  const collections = await proxyMongoose.connection.db.listCollections().toArray();
  console.log('Collections list:', collections.map(c => c.name));
  
  await proxyMongoose.disconnect();
}

main().catch(console.error);
