// test/get_db_date_range.js
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://backone_user:SusuKudaLiar@mongodb.prod.proit.id:27017/backone_dpi?authSource=backone_dpi';

async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to Production MongoDB');

    const db = mongoose.connection.db;
    const summariesCol = db.collection('summaries');

    // Get list of agents
    const agents = await summariesCol.distinct('agent_uuid', { agent_uuid: { $ne: null } });
    console.log('Agents found in database:', agents);

    console.log('\n--- DATE RANGE ANALYSIS PER AGENT ---');
    for (const agentUuid of agents) {
      // Find earliest and latest timestamp in summaries for this agent
      const bounds = await summariesCol.aggregate([
        { $match: { agent_uuid: agentUuid } },
        { 
          $group: { 
            _id: '$agent_uuid',
            minDate: { $min: '$timestamp' },
            maxDate: { $max: '$timestamp' },
            count: { $sum: 1 }
          }
        }
      ]).toArray();

      if (bounds.length > 0) {
        const { minDate, maxDate, count } = bounds[0];
        console.log(`Agent: ${agentUuid}`);
        console.log(`  Earliest Date: ${minDate ? new Date(minDate).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : 'N/A'}`);
        console.log(`  Latest Date  : ${maxDate ? new Date(maxDate).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : 'N/A'}`);
        console.log(`  Total Summaries Documents: ${count}`);
      } else {
        console.log(`Agent: ${agentUuid} (No summary documents found)`);
      }
    }

    // Also get overall collections bounds
    console.log('\n--- OVERALL COLLECTION BOUNDS ---');
    const colsToCheck = ['flows', 'appstats', 'threats', 'events'];
    for (const colName of colsToCheck) {
      const col = db.collection(colName);
      const firstDoc = await col.find().sort({ timestamp: 1 }).limit(1).toArray();
      const lastDoc = await col.find().sort({ timestamp: -1 }).limit(1).toArray();
      
      console.log(`Collection: ${colName}`);
      console.log(`  Earliest Doc: ${firstDoc[0]?.timestamp ? new Date(firstDoc[0].timestamp).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : 'N/A'}`);
      console.log(`  Latest Doc  : ${lastDoc[0]?.timestamp ? new Date(lastDoc[0].timestamp).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : 'N/A'}`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
