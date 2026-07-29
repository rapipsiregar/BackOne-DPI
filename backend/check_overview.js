const mongoose = require('mongoose');

mongoose.connect('mongodb://backone_user:SusuKudaLiar@103.80.237.29:27017/backone_dpi?authSource=backone_dpi')
  .then(async () => {
    const db = mongoose.connection.useDb('backone_dpi');
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
    const SIAB = '6681452d_9cae_4ff4_8ae8_0d504774265e';

    const catCount = await db.db.collection('appcategorystats').countDocuments({ site_uuid: SIAB, timestamp: { $gte: yesterday } });
    const catSum = await db.db.collection('appcategorystats').aggregate([
      { $match: { site_uuid: SIAB, timestamp: { $gte: yesterday } } },
      { $group: { _id: null, dl: { $sum: '$download' }, ul: { $sum: '$upload' } } }
    ]).toArray();

    const sumCount = await db.db.collection('summaries').countDocuments({ site_uuid: SIAB, timestamp: { $gte: yesterday } });
    const sumSum = await db.db.collection('summaries').aggregate([
      { $match: { site_uuid: SIAB, timestamp: { $gte: yesterday } } },
      { $group: { _id: null, dl: { $sum: '$bandwidth_down' }, ul: { $sum: '$bandwidth_up' } } }
    ]).toArray();

    const flowCount = await db.db.collection('flows').countDocuments({ site_uuid: SIAB, timestamp: { $gte: yesterday } });
    const flowSum = await db.db.collection('flows').aggregate([
      { $match: { site_uuid: SIAB, timestamp: { $gte: yesterday } } },
      { $group: { _id: null, dl: { $sum: '$download' }, ul: { $sum: '$upload' } } }
    ]).toArray();

    // Check latest timestamp in each collection for SIAB
    const latestCat = await db.db.collection('appcategorystats').findOne({ site_uuid: SIAB }, { sort: { timestamp: -1 } });
    const latestFlow = await db.db.collection('flows').findOne({ site_uuid: SIAB }, { sort: { timestamp: -1 } });
    const latestSum = await db.db.collection('summaries').findOne({ site_uuid: SIAB }, { sort: { timestamp: -1 } });

    console.log('=== SIAB Site Data Check (Last 24h) ===');
    console.log('AppCatStats (24h):', catCount, 'docs | Sum:', JSON.stringify(catSum[0]));
    console.log('Summaries (24h)  :', sumCount, 'docs | Sum:', JSON.stringify(sumSum[0]));
    console.log('Flows (24h)      :', flowCount, 'docs | Sum:', JSON.stringify(flowSum[0]));
    console.log('');
    console.log('=== Latest Timestamps ===');
    console.log('Latest AppCat    :', latestCat?.timestamp);
    console.log('Latest Flow      :', latestFlow?.timestamp);
    console.log('Latest Summary   :', latestSum?.timestamp);

    mongoose.disconnect();
  })
  .catch(e => { console.error('Error:', e.message); process.exit(1); });
