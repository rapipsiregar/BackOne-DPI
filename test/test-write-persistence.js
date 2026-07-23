const proxyMongoose = require('../proxy/node_modules/mongoose');
const { LookupApp } = require('../proxy/models/Schemas');

async function main() {
  const uri = 'mongodb://127.0.0.1:27017/backone_dpi';
  await proxyMongoose.connect(uri);
  
  console.log('Inserting dummy LookupApp...');
  await LookupApp.deleteMany({});
  const doc = await LookupApp.create({
    id: 99999,
    tag: 'netify.dummytest',
    label: 'Dummy Test App',
    name: 'Dummy Test App',
    description: 'A test document to verify write persistence',
    application_category: { id: 1, name: 'test', label: 'Test', tag: 'test' }
  });
  console.log('Created document id:', doc._id);
  
  const count = await LookupApp.countDocuments({});
  console.log('Count inside writer:', count);
  
  await proxyMongoose.disconnect();
}

main().catch(console.error);
