// test/check-ip-mongo.js
const { MongoClient } = require('mongodb');

const URI = 'mongodb://backone_user:SusuKudaLiar@103.80.237.29:27017/backone_dpi?authSource=backone_dpi';

async function main() {
  console.log('Connecting to MongoDB via IP 103.80.237.29...');
  const client = new MongoClient(URI, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    console.log('✓ Successfully connected to MongoDB via IP!');
    const db = client.db('backone_dpi');
    const cols = await db.listCollections().toArray();
    console.log('Collections:', cols.map(c => c.name));
  } catch (err) {
    console.error('✗ Connection failed:', err.message);
  } finally {
    await client.close();
  }
}

main();
