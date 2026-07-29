// scripts/export-local-db.js
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const LOCAL_URI = 'mongodb://127.0.0.1:27017/backone_dpi';
const DB_NAME = 'backone_dpi';

const COLLECTIONS_TO_EXPORT = ['users', 'tenantconfigs', 'customagentlocations'];
const OUTPUT_DIR = path.join(__dirname, '..', 'migration-temp');

async function main() {
  console.log('Connecting to local MongoDB...');
  const client = new MongoClient(LOCAL_URI);
  
  try {
    await client.connect();
    console.log('✓ Connected to local MongoDB successfully.');
    const db = client.db(DB_NAME);
    
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR);
    }
    
    for (const colName of COLLECTIONS_TO_EXPORT) {
      console.log(`Exporting collection: ${colName}...`);
      const documents = await db.collection(colName).find({}).toArray();
      const filePath = path.join(OUTPUT_DIR, `${colName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
      console.log(`  ✓ Exported ${documents.length} documents to ${filePath}`);
    }
    
    console.log('\n✓ Database export complete!');
  } catch (err) {
    console.error('✗ Export failed:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
