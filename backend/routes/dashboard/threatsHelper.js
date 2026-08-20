// backend/routes/dashboard/threatsHelper.js
// ─────────────────────────────────────────────────────────────────────────────
// Intelligence data mapping helpers for threats routes
// ─────────────────────────────────────────────────────────────────────────────

const { getTimeFilter, getBaseFilter } = require('./helpers');

async function getIntelData(Threat, req, threatTypeRegex = null, limit = 0) {
  const timeFilter = getTimeFilter(req);
  const query      = getBaseFilter(req, timeFilter);
  
  if (threatTypeRegex) {
    query.threat_type = { $regex: threatTypeRegex, $options: 'i' };
  }

  let dbQuery = Threat.find(query).sort({ detected_at: -1, timestamp: -1 });
  if (limit > 0) dbQuery = dbQuery.limit(limit);
  
  const list = await dbQuery.lean();

  return list.map((t) => {
    const ip = t.ip_address || t.src_ip;
    const mac = t.mac_address || t.src_mac;
    const eTime = t.detected_at || t.timestamp?.toISOString() || new Date().toISOString();
    return {
      id:                 t._id?.toString(),
      detected_at:        eTime,
      ip_address:         ip,
      mac_address:        mac,
      pool_host:          t.domain || null,
      pool_ip:            t.dst_ip || null,
      protocol:           t.protocol || 'TCP',
      app_label:          t.app_label || 'Unknown',
      confidence:         t.severity === 'Critical' ? 99 : (t.severity === 'High' ? 90 : 75),
      download:           t.download || 0,
      upload:             t.upload || 0,
      exit_node:          t.dst_ip || null,
      circuit_id:         t.flow_id || null,
      country:            'Unknown',
      vpn_type:           t.app_label || 'Unknown VPN',
      remote_ip:          t.dst_ip || null,
      device_label:       ip,
      device_type:        'Unknown',
      os_label:           'Unknown',
      manufacturer:       'Unknown',
      risk_level:         t.severity || 'Medium',
      risk:               t.severity || 'Medium',
      reputation:         t.threat_type || 'Malicious IP',
      severity:           t.severity || 'Warning'
    };
  });
}

module.exports = {
  getIntelData
};
