const mongoose = require('mongoose');
require('dotenv').config({ path: './.env.local' });

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/backone_dpi';
  await mongoose.connect(uri);
  
  const dbsList = await new mongoose.mongo.Admin(mongoose.connection.db).listDatabases();
  console.log('--- All Databases ---');
  for (const dbInfo of dbsList.databases) {
    const conn = mongoose.createConnection(`mongodb://127.0.0.1:27017/${dbInfo.name}`);
    await new Promise(resolve => conn.once('open', resolve));
    const collections = await conn.db.listCollections().toArray();
    for (const col of collections) {
      if (col.name === 'lookupapps') {
        const count = await conn.db.collection('lookupapps').countDocuments({});
        console.log(`DB: ${dbInfo.name} -> collection: lookupapps -> count: ${count}`);
      }
    }
    await conn.close();
  }
  
  await mongoose.disconnect();
}

main().catch(console.error);
