// scripts/migrate_production_config.js
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = require('crypto');
}
const { MongoClient } = require('mongodb');
const path = require('path');

const LOCAL_URI = 'mongodb://127.0.0.1:27017';
const REMOTE_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/backone_dpi';
const DB_NAME = 'backone_dpi';

async function migrate() {
  console.log("=============================================================");
  console.log("   BackOne DPI - Selective Configuration Migration to Prod   ");
  console.log("=============================================================\n");
  
  let localClient, remoteClient;
  try {
    console.log("Connecting to local MongoDB...");
    localClient = new MongoClient(LOCAL_URI, { serverSelectionTimeoutMS: 3000 });
    await localClient.connect();
    const localDb = localClient.db(DB_NAME);
    console.log("✓ Connected to local MongoDB.");

    console.log("Connecting to production MongoDB...");
    remoteClient = new MongoClient(REMOTE_URI, { serverSelectionTimeoutMS: 5000 });
    await remoteClient.connect();
    const remoteDb = remoteClient.db(DB_NAME);
    console.log("✓ Connected to production MongoDB.\n");

    // 1. Sync users (Upsert based on username to preserve existing user credentials if updated)
    console.log("--- Syncing 'users' collection ---");
    const localUsersColl = localDb.collection('users');
    const remoteUsersColl = remoteDb.collection('users');
    
    const localUsers = await localUsersColl.find({}).toArray();
    console.log(`Found ${localUsers.length} users in local database.`);
    
    let userUpsertCount = 0;
    for (const user of localUsers) {
      // Remove _id to avoid duplicate key errors or mismatched ObjectId
      const { _id, ...userData } = user;
      const res = await remoteUsersColl.updateOne(
        { username: user.username },
        { $set: userData },
        { upsert: true }
      );
      if (res.upsertedCount > 0 || res.modifiedCount > 0) {
        userUpsertCount++;
      }
    }
    console.log(`✓ Synchronized ${userUpsertCount} users to production MongoDB.`);

    // 2. Sync tenantconfigs (Clear & Replace)
    console.log("\n--- Syncing 'tenantconfigs' collection ---");
    const localConfigColl = localDb.collection('tenantconfigs');
    const remoteConfigColl = remoteDb.collection('tenantconfigs');
    
    const localConfigs = await localConfigColl.find({}).toArray();
    console.log(`Found ${localConfigs.length} tenant configurations locally.`);
    
    if (localConfigs.length > 0) {
      await remoteConfigColl.deleteMany({});
      const cleanedConfigs = localConfigs.map(c => {
        const { _id, ...rest } = c;
        return rest;
      });
      await remoteConfigColl.insertMany(cleanedConfigs);
      console.log(`✓ Synchronized ${localConfigs.length} configurations to production.`);
    }

    // 3. Sync customagentlocations (Clear & Replace)
    console.log("\n--- Syncing 'customagentlocations' collection ---");
    const localLocColl = localDb.collection('customagentlocations');
    const remoteLocColl = remoteDb.collection('customagentlocations');
    
    const localLocs = await localLocColl.find({}).toArray();
    console.log(`Found ${localLocs.length} agent locations locally.`);
    
    if (localLocs.length > 0) {
      await remoteLocColl.deleteMany({});
      const cleanedLocs = localLocs.map(l => {
        const { _id, ...rest } = l;
        return rest;
      });
      await remoteLocColl.insertMany(cleanedLocs);
      console.log(`✓ Synchronized ${localLocs.length} agent locations to production.`);
    }

    // 4. Sync blacklistrules (Clear & Replace, if exists)
    console.log("\n--- Syncing 'blacklistrules' collection ---");
    const localRulesColl = localDb.collection('blacklistrules');
    const remoteRulesColl = remoteDb.collection('blacklistrules');
    
    // Check if collection exists
    const localColls = await localDb.listCollections({ name: 'blacklistrules' }).toArray();
    if (localColls.length > 0) {
      const localRules = await localRulesColl.find({}).toArray();
      console.log(`Found ${localRules.length} blacklist rules locally.`);
      if (localRules.length > 0) {
        await remoteRulesColl.deleteMany({});
        const cleanedRules = localRules.map(r => {
          const { _id, ...rest } = r;
          return rest;
        });
        await remoteRulesColl.insertMany(cleanedRules);
        console.log(`✓ Synchronized ${localRules.length} blacklist rules to production.`);
      }
    } else {
      console.log("No blacklist rules found locally.");
    }

    console.log("\n=============================================================");
    console.log("✓ Database configuration migration completed successfully!");
    console.log("=============================================================");

  } catch (err) {
    console.error("\n✗ Migration failed:", err.message);
    process.exit(1);
  } finally {
    if (localClient) await localClient.close();
    if (remoteClient) await remoteClient.close();
  }
}

migrate();
