const mongoose = require('mongoose');

async function main() {
  const uri = 'mongodb://127.0.0.1:27017/backone_dpi';
  await mongoose.connect(uri);
  
  const count = await mongoose.connection.db.collection('lookupapps').countDocuments({});
  console.log('Count inside reader:', count);
  
  const doc = await mongoose.connection.db.collection('lookupapps').findOne({ id: 99999 });
  console.log('Found document:', doc);
  
  await mongoose.disconnect();
}

main().catch(console.error);
