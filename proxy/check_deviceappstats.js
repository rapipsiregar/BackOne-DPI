const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb://127.0.0.1:27017');

client.connect().then(async () => {
  const db = client.db('backone_dpi');
  const col = db.collection('deviceappstats');
  const CIBUBUR = '2F-TF-1D-GK';
  const BALARAJA = 'F6-2V-DT-8A';

  const countCibubur = await col.countDocuments({ agent_uuid: CIBUBUR, app_label: 'YouTube' });
  const countBalaraja = await col.countDocuments({ agent_uuid: BALARAJA, app_label: 'YouTube' });
  
  const sampleCibubur = await col.find({ agent_uuid: CIBUBUR, app_label: 'YouTube' }).sort({ timestamp: -1 }).limit(10).toArray();
  const sampleBalaraja = await col.find({ agent_uuid: BALARAJA, app_label: 'YouTube' }).sort({ timestamp: -1 }).limit(5).toArray();

  console.log(`DeviceAppStat count YouTube:`);
  console.log(`- JRP Cibubur (${CIBUBUR}): ${countCibubur}`);
  console.log(`- CPI Balaraja (${BALARAJA}): ${countBalaraja}`);
  
  console.log(`\nSample JRP Cibubur DeviceAppStat for YouTube:`);
  sampleCibubur.forEach(r => {
    console.log(`  IP: ${r.ip_address} | DL: ${(r.download/1e6).toFixed(2)} MB | UL: ${(r.upload/1e6).toFixed(2)} MB | Time: ${r.timestamp.toISOString()}`);
  });

  await client.close();
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
