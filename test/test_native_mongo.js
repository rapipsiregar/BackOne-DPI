// test/test_native_mongo.js
const { MongoClient } = require('mongodb');

async function test() {
  const url = 'mongodb://127.0.0.1:27017';
  const client = new MongoClient(url);

  try {
    console.log("Connecting natively to MongoDB...");
    await client.connect();
    console.log("Connected successfully!");

    const db = client.db('backone_dpi');
    const collection = db.collection('devicestats');

    console.log("Querying devicestats natively...");
    const start = Date.now();
    const count = await collection.countDocuments({});
    console.log(`Successfully queried! Total docs in devicestats: ${count}`);
    console.log(`Query took ${Date.now() - start} ms`);

  } catch (err) {
    console.error("Native test failed:", err);
  } finally {
    await client.close();
    console.log("Disconnected.");
  }
}

test();
