const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb://127.0.0.1:27017');

client.connect().then(async () => {
  const db = client.db('backone_dpi');
  const col = db.collection('flows');
  const SIAB = '6681452d_9cae_4ff4_8ae8_0d504774265e';

  const july13start = new Date('2026-07-13T00:00:00.000+07:00');
  const july13end   = new Date('2026-07-13T23:59:59.999+07:00');
  const july14start = new Date('2026-07-14T00:00:00.000+07:00');

  const count13 = await col.countDocuments({ site_uuid: SIAB, timestamp: { $gte: july13start, $lte: july13end } });
  const count14 = await col.countDocuments({ site_uuid: SIAB, timestamp: { $gte: july14start } });
  const total   = await col.countDocuments({ site_uuid: SIAB });

  const oldest = await col.findOne({ site_uuid: SIAB }, { sort: { timestamp: 1 }, projection: { timestamp: 1, first_seen: 1, last_seen: 1 } });
  const newest = await col.findOne({ site_uuid: SIAB }, { sort: { timestamp: -1 }, projection: { timestamp: 1, first_seen: 1, last_seen: 1 } });

  const sample13 = await col.findOne(
    { site_uuid: SIAB, timestamp: { $gte: july13start, $lte: july13end } },
    { projection: { timestamp: 1, first_seen: 1, last_seen: 1, flow_id: 1, agent_uuid: 1 } }
  );

  console.log('Total SIAB flows:', total);
  console.log('SIAB flows with timestamp on July 13:', count13);
  console.log('SIAB flows with timestamp on July 14+:', count14);
  console.log('Oldest flow:', JSON.stringify(oldest, null, 2));
  console.log('Newest flow:', JSON.stringify(newest, null, 2));
  console.log('Sample July 13 flow:', JSON.stringify(sample13, null, 2));

  await client.close();
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
