// test/check_local_db.js
const { MongoClient } = require('mongodb');

const LOCAL_URI = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'backone_dpi';

async function main() {
  const client = new MongoClient(LOCAL_URI, { serverSelectionTimeoutMS: 2000 });
  try {
    await client.connect();
    console.log("✓ Connected to local MongoDB successfully!");
    const db = client.db(DB_NAME);
    const collections = await db.listCollections().toArray();
    console.log("Collections in local database:", collections.map(c => c.name));
    
    if (collections.some(c => c.name === 'users')) {
      const users = await db.collection('users').find({}).toArray();
      console.log(`Users in local database (${users.length}):`);
      users.forEach(u => console.log(`- Username: ${u.username}, Role: ${u.role}, Email: ${u.email || 'N/A'}`));
    } else {
      console.log("No 'users' collection locally.");
    }
  } catch (err) {
    console.error("✗ Local MongoDB connection failed:", err.message);
  } finally {
    await client.close();
  }
}

main();
