// test/fix_blacklist_indexes.js
const mongoose = require('mongoose');

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect('mongodb://127.0.0.1:27017/backone_dpi');
  console.log("Connected successfully!");

  const db = mongoose.connection.db;
  const collection = db.collection('blacklistrules');

  console.log("Dropping all existing indexes on blacklistrules collection...");
  try {
    await collection.dropIndexes();
    console.log("✓ Indexes dropped successfully.");
  } catch (err) {
    console.warn("Could not drop indexes (probably collection doesn't exist yet):", err.message);
  }

  console.log("Cleaning up old blacklist rules that don't have agent_uuid...");
  const deleteResult = await collection.deleteMany({
    $or: [
      { agent_uuid: { $exists: false } },
      { agent_uuid: null },
      { agent_uuid: "" }
    ]
  });
  console.log(`✓ Deleted ${deleteResult.deletedCount} legacy blacklist rules.`);

  console.log("Rebuilding Mongoose model indexes...");
  const { BlacklistRule } = require('../backend/models/Schemas');
  await BlacklistRule.cleanIndexes();
  await BlacklistRule.createIndexes();
  console.log("✓ New compound indexes built successfully!");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}

run().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
