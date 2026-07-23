const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/backone_dpi';
const SIAB = '6681452d_9cae_4ff4_8ae8_0d504774265e';

mongoose.connect(MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const since24h = new Date(Date.now() - 24 * 3600000);
  const since7d   = new Date(Date.now() - 7  * 24 * 3600000);

  // Count site-level summary docs
  const count24h = await db.collection('summaries').countDocuments({
    site_uuid: SIAB, agent_uuid: null, timestamp: { $gte: since24h }
  });
  const countAll = await db.collection('summaries').countDocuments({
    site_uuid: SIAB, agent_uuid: null
  });

  // Sum bandwidth for last 24h (site-level, agent_uuid: null)
  const agg24h = await db.collection('summaries').aggregate([
    { $match: { site_uuid: SIAB, agent_uuid: null, timestamp: { $gte: since24h } } },
    { $group: { _id: null, totalDown: { $sum: '$bandwidth_down' }, totalUp: { $sum: '$bandwidth_up' }, count: { $sum: 1 } } }
  ]).toArray();

  // Sum bandwidth ALL time (site-level)
  const aggAll = await db.collection('summaries').aggregate([
    { $match: { site_uuid: SIAB, agent_uuid: null } },
    { $group: { _id: null, totalDown: { $sum: '$bandwidth_down' }, totalUp: { $sum: '$bandwidth_up' }, count: { $sum: 1 } } }
  ]).toArray();

  // Oldest and newest
  const oldest = await db.collection('summaries').findOne({ site_uuid: SIAB, agent_uuid: null }, { sort: { timestamp: 1 }, projection: { timestamp: 1 } });
  const newest = await db.collection('summaries').findOne({ site_uuid: SIAB, agent_uuid: null }, { sort: { timestamp: -1 }, projection: { timestamp: 1, bandwidth_down: 1, bandwidth_up: 1 } });

  console.log('\n=== MongoDB Summary Check (SIAB site) ===');
  console.log('Total site-level docs:', countAll);
  console.log('Site-level docs in last 24h:', count24h);
  console.log('\nBandwidth SUM (last 24h):');
  console.log('  Down:', agg24h[0] ? (agg24h[0].totalDown / 1024 / 1024).toFixed(2) + ' MB' : '0 MB');
  console.log('  Up  :', agg24h[0] ? (agg24h[0].totalUp   / 1024 / 1024).toFixed(2) + ' MB' : '0 MB');
  console.log('\nBandwidth SUM (ALL time):');
  console.log('  Down:', aggAll[0] ? (aggAll[0].totalDown / 1024 / 1024).toFixed(2) + ' MB' : '0 MB');
  console.log('  Up  :', aggAll[0] ? (aggAll[0].totalUp   / 1024 / 1024).toFixed(2) + ' MB' : '0 MB');
  console.log('\nOldest entry :', oldest?.timestamp);
  console.log('Newest entry :', newest?.timestamp);
  console.log('Latest bandwidth_down per 5min:', newest ? (newest.bandwidth_down / 1024 / 1024).toFixed(4) + ' MB' : 'N/A');
  console.log('Latest bandwidth_up per 5min  :', newest ? (newest.bandwidth_up   / 1024 / 1024).toFixed(4) + ' MB' : 'N/A');

  // Also check flow data for comparison
  const flowAgg = await db.collection('flows').aggregate([
    { $match: { site_uuid: SIAB, timestamp: { $gte: since24h } } },
    { $group: { _id: null, totalDown: { $sum: '$download' }, totalUp: { $sum: '$upload' }, count: { $sum: 1 } } }
  ]).toArray();
  console.log('\nFlow-level bandwidth (last 24h from flows collection):');
  console.log('  Down:', flowAgg[0] ? (flowAgg[0].totalDown / 1024 / 1024).toFixed(2) + ' MB' : '0 MB');
  console.log('  Up  :', flowAgg[0] ? (flowAgg[0].totalUp   / 1024 / 1024).toFixed(2) + ' MB' : '0 MB');
  console.log('  Flow count:', flowAgg[0]?.count || 0);
  console.log('=====================================\n');

  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
