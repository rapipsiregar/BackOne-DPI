// test/check_prod_after_migration.js
const { MongoClient } = require('mongodb');

const REMOTE_URI = 'mongodb://backone_user:SusuKudaLiar@mongodb.prod.proit.id:27017/backone_dpi?authSource=backone_dpi';
const DB_NAME = 'backone_dpi';

async function main() {
  const client = new MongoClient(REMOTE_URI, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    console.log("✓ Connected to production MongoDB successfully!");
    const db = client.db(DB_NAME);
    const collections = await db.listCollections().toArray();
    console.log("Collections in production database:", collections.map(c => c.name));
    
    const users = await db.collection('users').find({}).toArray();
    console.log(`Users in production MongoDB (${users.length}):`);
    users.forEach(u => console.log(`- Username: ${u.username}, Role: ${u.role}, Site UUID: ${u.site_uuid || 'N/A'}`));
    
    const configCount = await db.collection('tenantconfigs').countDocuments();
    const locCount = await db.collection('customagentlocations').countDocuments();
    console.log(`\nConfig entries: ${configCount}, Custom location entries: ${locCount}`);
  } catch (err) {
    console.error("✗ Production MongoDB connection failed:", err.message);
  } finally {
    await client.close();
  }
}

main();
