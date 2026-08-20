// backend/routes/dashboard/telemetryHelper.js
// ─────────────────────────────────────────────────────────────────────────────
// Aggregation helpers for Telemetry routes (SNI, SSL, QUIC fallbacks)
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_DOMAINS = ['agents.backone.ai', 'agents.backonedpi.ai'];

async function getSniFallbackData(Flow, matchBase, fieldName) {
  const flowBase = { ...matchBase, domain: { $exists: true, $ne: null, $ne: '', $nin: SYSTEM_DOMAINS } };
  const flowRaw = await Flow.aggregate([
    { $match: flowBase },
    { $group: { _id: '$domain', download: { $sum: '$download' }, upload: { $sum: '$upload' }, flows: { $sum: 1 } } },
    { $project: { [fieldName]: '$_id', total: { $add: ['$download', '$upload'] }, download: 1, upload: 1, flows: 1, _id: 0 } },
    { $sort: { total: -1 } }
  ]);
  return flowRaw.filter(r => r[fieldName] && !String(r[fieldName]).startsWith('Port '));
}

module.exports = {
  SYSTEM_DOMAINS,
  getSniFallbackData
};
