// proxy/db/capacityTracker.js
// ─────────────────────────────────────────────────────────────────────────────
// MongoDB Capacity & Data Size Breakdown per Network Agent.
// Measures logical document sizes per agent_uuid across all collections.
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

async function logCapacityStats(prefix = '[MongoDB]') {
  try {
    if (!mongoose.connection || !mongoose.connection.db) {
      return;
    }
    const db = mongoose.connection.db;

    const stats = await db.command({ dbStats: 1 });
    const dataSizeMB = (stats.dataSize / (1024 * 1024)).toFixed(2);
    const storageSizeMB = (stats.storageSize / (1024 * 1024)).toFixed(2);
    console.log(`${prefix} Capacity Used: Data Size = ${dataSizeMB} MB, Storage Size = ${storageSizeMB} MB`);

    const agentSizes = {};
    const collections = await db.listCollections().toArray();
    
    for (const colInfo of collections) {
      const colName = colInfo.name;
      if (colName.startsWith('system.')) continue;
      const col = db.collection(colName);

      const sampleDoc = await col.findOne({ agent_uuid: { $ne: null } });
      if (!sampleDoc) continue;

      const pipeline = [
        { $project: { agent_uuid: 1, docSize: { $bsonSize: "$$ROOT" } } },
        { $group: { _id: "$agent_uuid", totalBytes: { $sum: "$docSize" } } }
      ];
      
      const results = await col.aggregate(pipeline).toArray();
      for (const res of results) {
        const agent = res._id || 'Unknown';
        agentSizes[agent] = (agentSizes[agent] || 0) + res.totalBytes;
      }
    }

    const sortedAgents = Object.entries(agentSizes)
      .map(([agent, bytes]) => ({ agent, sizeMB: parseFloat((bytes / (1024 * 1024)).toFixed(2)) }))
      .sort((a, b) => b.sizeMB - a.sizeMB);

    if (sortedAgents.length > 0) {
      console.log(`${prefix} Data Size Breakdown per Agent:`);
      for (const { agent, sizeMB } of sortedAgents) {
        console.log(`  - ${agent}: ${sizeMB.toFixed(2)} MB`);
      }
    }
  } catch (err) {
    console.warn(`${prefix} Could not retrieve DB capacity breakdown:`, err.message);
  }
}

module.exports = { logCapacityStats };
