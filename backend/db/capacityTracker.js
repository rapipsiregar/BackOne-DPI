// backend/db/capacityTracker.js
// ─────────────────────────────────────────────────────────────────────────────
// MongoDB Capacity & Data Size Breakdown per Network Agent.
// Uses $collStats (O(1)) + per-agent document counts (indexed) for speed.
// Results are cached in memory and refreshed on each call.
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

// In-memory cache — shared with the agents/storage API endpoint
let agentSizesCache = {};    // { agentUuid: sizeMB }
let lastCacheUpdate  = null; // Date of last successful update

async function logCapacityStats(prefix = '[MongoDB]') {
  try {
    if (!mongoose.connection || !mongoose.connection.db) return;
    const db = mongoose.connection.db;

    // 1. Overall database stats (fast — reads WiredTiger metadata)
    const stats       = await db.command({ dbStats: 1 });
    const dataSizeMB  = (stats.dataSize    / (1024 * 1024)).toFixed(2);
    const storageMB   = (stats.storageSize / (1024 * 1024)).toFixed(2);
    console.log(`${prefix} Capacity Used: Data Size = ${dataSizeMB} MB, Storage Size = ${storageMB} MB`);

    // 2. Fast per-agent estimate: avgObjSize (from $collStats) × document count per agent
    const agentBytes  = {};
    const collections = await db.listCollections().toArray();

    for (const colInfo of collections) {
      const colName = colInfo.name;
      if (colName.startsWith('system.')) continue;
      const col = db.collection(colName);

      // Check collection has agent-tagged documents
      const sampleDoc = await col.findOne({ agent_uuid: { $ne: null } }, { projection: { _id: 1 } });
      if (!sampleDoc) continue;

      // $collStats is O(1) — reads storage engine metadata, never scans documents
      const collStatsArr = await col.aggregate([{ $collStats: { storageStats: {} } }]).toArray();
      const avgObjSize   = collStatsArr[0]?.storageStats?.avgObjSize || 512; // bytes

      // Count documents per agent using the existing agent_uuid index
      const countResult = await col.aggregate([
        { $group: { _id: '$agent_uuid', count: { $sum: 1 } } }
      ]).toArray();

      for (const r of countResult) {
        const agent = r._id || 'Unknown';
        agentBytes[agent] = (agentBytes[agent] || 0) + (r.count * avgObjSize);
      }
    }

    // 3. Format, log, and update cache
    const sorted = Object.entries(agentBytes)
      .map(([agent, bytes]) => ({ agent, sizeMB: parseFloat((bytes / (1024 * 1024)).toFixed(2)) }))
      .sort((a, b) => b.sizeMB - a.sizeMB);

    if (sorted.length > 0) {
      console.log(`${prefix} Data Size Breakdown per Agent:`);
      for (const { agent, sizeMB } of sorted) {
        console.log(`  - ${agent}: ${sizeMB.toFixed(2)} MB`);
      }
    }

    agentSizesCache = {};
    for (const { agent, sizeMB } of sorted) {
      agentSizesCache[agent] = sizeMB;
    }
    lastCacheUpdate = new Date();

  } catch (err) {
    console.warn(`${prefix} Could not retrieve DB capacity breakdown:`, err.message);
  }
}

module.exports = { logCapacityStats, agentSizesCache: () => agentSizesCache, lastCacheUpdate: () => lastCacheUpdate };

