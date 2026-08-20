// proxy/dataRetention.js
// ─────────────────────────────────────────────────────────────────────────────
// Pruning process for BackOne MongoDB data retention.
// Removes telemetry records older than 30 days to conserve database space.
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose');
const Schemas = require('./models/Schemas');

/**
 * Prune all time-series documents older than 30 days.
 */
async function pruneOldData() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const timeString = thirtyDaysAgo.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB';
  console.log(`[Collector] [Retention] Checking for telemetry data older than 30 days (before ${timeString})...`);

  // Prune from all collections in Schemas except CustomDeviceLabel, AgentRegistry, TenantConfig
  const collections = Object.keys(Schemas).filter(name => name !== 'CustomDeviceLabel' && name !== 'AgentRegistry' && name !== 'TenantConfig');

  for (const name of collections) {
    try {
      const Model = Schemas[name];
      if (typeof Model.deleteMany === 'function') {
        const res = await Model.deleteMany({ timestamp: { $lt: thirtyDaysAgo } });
        if (res.deletedCount > 0) {
          console.log(`[Collector] [Retention]   ✓ Cleaned up ${res.deletedCount} old records from ${name}`);
        }
      }
    } catch (err) {
      console.error(`[Collector] [Retention]   ✗ Failed to prune ${name}: ${err.message}`);
    }
  }
}

module.exports = { pruneOldData };
