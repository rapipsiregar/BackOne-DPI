// scripts/migrate-db-remote.js
global.crypto = require('crypto');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const REMOTE_URI = 'mongodb://backone_user:SusuKudaLiar@103.80.237.29:27017/backone_dpi?authSource=backone_dpi';
const DB_NAME = 'backone_dpi';
const DATA_DIR = __dirname;

async function migrateCollection(db, colName, keyField) {
  const filePath = path.join(DATA_DIR, `${colName}.json`);
  if (!fs.existsSync(filePath)) {
    console.log(`  [SKIP] ${colName}.json not found in migration folder.`);
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const documents = JSON.parse(raw);
  console.log(`\nMigrating collection: ${colName} (${documents.length} docs)...`);

  const col = db.collection(colName);
  let upsertedCount = 0;
  let matchedCount = 0;

  for (const doc of documents) {
    // Preserve MongoDB Object ID or convert it properly if it has $oid notation
    const query = {};
    query[keyField] = doc[keyField];

    // Clean up _id or preserve it
    const updateDoc = { ...doc };
    if (updateDoc._id) {
      if (updateDoc._id.$oid) {
        // If it's exported via mongoexport format
        delete updateDoc._id;
      } else {
        // Remove _id from update payload to prevent "change _id" errors on upsert
        delete updateDoc._id;
      }
    }

    const result = await col.updateOne(
      query,
      { $set: updateDoc },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      upsertedCount++;
    } else {
      matchedCount++;
    }
  }

  console.log(`  ✓ Finished ${colName}: ${upsertedCount} new inserted (upserted), ${matchedCount} existing updated.`);
}

async function main() {
  console.log('=== STARTING PRODUCTION DATABASE MIGRATION ===');
  console.log('Connecting to production MongoDB...');
  const client = new MongoClient(REMOTE_URI, { serverSelectionTimeoutMS: 5000 });

  try {
    await client.connect();
    console.log('✓ Connected to production MongoDB successfully!');
    const db = client.db(DB_NAME);

    // Run migrations using distinct key fields for upserting
    await migrateCollection(db, 'users', 'username');
    await migrateCollection(db, 'tenantconfigs', 'site_uuid');
    await migrateCollection(db, 'customagentlocations', 'agent_uuid');

    console.log('\n=== MIGRATION COMPLETED SUCCESSFULLY ===');
  } catch (err) {
    console.error('\n✗ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
