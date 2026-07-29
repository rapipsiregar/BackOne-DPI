// test/tunnel_migrate.js
const { Client } = require('ssh2');
const net = require('net');
const { MongoClient } = require('mongodb');

const sshConfig = {
  host: process.env.SSH_HOST || '127.0.0.1',
  port: parseInt(process.env.SSH_PORT || '2222'),
  username: process.env.SSH_USER || 'adminbackend',
  password: process.env.SSH_PASSWORD || '',
  readyTimeout: 60000
};

const LOCAL_PORT = 27018;
const REMOTE_MONGO_HOST = 'mongodb.prod.proit.id';
const REMOTE_MONGO_PORT = 27017;

const conn = new Client();
const server = net.createServer((sock) => {
  conn.forwardOut(
    '127.0.0.1',
    sock.remotePort,
    REMOTE_MONGO_HOST,
    REMOTE_MONGO_PORT,
    (err, stream) => {
      if (err) {
        sock.destroy();
        return;
      }
      sock.pipe(stream);
      stream.pipe(sock);
    }
  );
});

conn.on('ready', () => {
  server.listen(LOCAL_PORT, '127.0.0.1', async () => {
    console.log(`✓ SSH Tunnel established: 127.0.0.1:${LOCAL_PORT} -> ${REMOTE_MONGO_HOST}:${REMOTE_MONGO_PORT}`);
    try {
      await runMigration();
    } catch (e) {
      console.error("✗ Migration failed:", e);
    } finally {
      server.close();
      conn.end();
      console.log("Tunnel closed.");
    }
  });
}).on('error', (err) => {
  console.error("SSH Connection error:", err.message);
}).connect(sshConfig);

async function runMigration() {
  const LOCAL_URI = 'mongodb://127.0.0.1:27017';
  const REMOTE_URI = process.env.MONGODB_URI || `mongodb://backone_user:password@127.0.0.1:${LOCAL_PORT}/backone_dpi?authSource=backone_dpi`;
  const DB_NAME = 'backone_dpi';

  console.log("Connecting to local MongoDB...");
  const localClient = new MongoClient(LOCAL_URI);
  await localClient.connect();
  const localDb = localClient.db(DB_NAME);
  console.log("✓ Connected to local MongoDB.");

  console.log("Connecting to production MongoDB via tunnel...");
  const remoteClient = new MongoClient(REMOTE_URI, { serverSelectionTimeoutMS: 5000 });
  await remoteClient.connect();
  const remoteDb = remoteClient.db(DB_NAME);
  console.log("✓ Connected to production MongoDB.\n");

  // 1. Sync users
  console.log("--- Syncing 'users' collection ---");
  const localUsersColl = localDb.collection('users');
  const remoteUsersColl = remoteDb.collection('users');
  
  const localUsers = await localUsersColl.find({}).toArray();
  console.log(`Found ${localUsers.length} users in local database.`);
  
  let userUpsertCount = 0;
  for (const user of localUsers) {
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

  // 2. Sync tenantconfigs
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

  // 3. Sync customagentlocations
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

  // 4. Sync blacklistrules
  console.log("\n--- Syncing 'blacklistrules' collection ---");
  const localRulesColl = localDb.collection('blacklistrules');
  const remoteRulesColl = remoteDb.collection('blacklistrules');
  
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

  await localClient.close();
  await remoteClient.close();
  console.log("\n✓ Database configuration migration completed successfully!");
}
