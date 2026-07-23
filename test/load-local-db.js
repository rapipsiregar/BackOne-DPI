const fs = require('fs');
const mongoose = require('mongoose');

async function main() {
  const dumpPath = 'C:\\Users\\demo\\.gemini\\antigravity-ide\\scratch\\remote_db_dump.json';
  if (!fs.existsSync(dumpPath)) {
    console.error('Error: Dump file not found.');
    return;
  }
  
  const rawData = fs.readFileSync(dumpPath, 'utf8');
  const data = JSON.parse(rawData);
  
  const LOCAL_URI = 'mongodb://127.0.0.1:27017/backone_dpi';
  console.log('Connecting to local MongoDB...');
  await mongoose.connect(LOCAL_URI);
  console.log('✓ Connected to local MongoDB.');
  
  const db = mongoose.connection.db;
  
  for (const [colName, info] of Object.entries(data)) {
    if (info.docs) {
      console.log(`\n--- Loading collection "${colName}" (${info.docs.length} docs) ---`);
      
      // Clear local collection first
      await db.collection(colName).deleteMany({});
      console.log(`- Cleared local "${colName}"`);
      
      // If we have documents to insert, convert any _id strings to ObjectIds (if appropriate) and insert
      if (info.docs.length > 0) {
        const cleanedDocs = info.docs.map(doc => {
          // MongoDB serialization via JSON converts ObjectId to string/object representation.
          // Let's restore _id to ObjectId.
          if (doc._id) {
            try {
              if (typeof doc._id === 'string') {
                doc._id = new mongoose.Types.ObjectId(doc._id);
              } else if (doc._id.$oid) {
                doc._id = new mongoose.Types.ObjectId(doc._id.$oid);
              }
            } catch (e) {
              // fallback to original if not a valid ObjectId format
            }
          }
          // Also restore date fields
          for (const key of Object.keys(doc)) {
            if (typeof doc[key] === 'string' && doc[key].match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
              doc[key] = new Date(doc[key]);
            }
          }
          return doc;
        });
        
        await db.collection(colName).insertMany(cleanedDocs);
        console.log(`- Inserted ${cleanedDocs.length} documents into "${colName}"`);
      }
    }
  }
  
  await mongoose.disconnect();
  console.log('\n✓ Successfully loaded remote dump into local database!');
}

main().catch(console.error);
