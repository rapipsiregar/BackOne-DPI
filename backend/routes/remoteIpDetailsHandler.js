// backend/routes/remoteIpDetailsHandler.js
const { Flow, Threat } = require('../models/Schemas');

module.exports = async function remoteIpDetailsHandler(req, res, helpers) {
  try {
    const { getTimeFilter } = helpers;
    const ip = String(req.query.ip ?? '');
    if (!ip) return res.status(400).json({ ok: false, message: 'ip required' });

    const flowFilter = {};
    if (req.user?.site_uuid) flowFilter.site_uuid = req.user.site_uuid;
    
    // Agent scope if viewer or query param
    if (req.user?.role === 'AGENT_VIEWER' && req.user?.agent_uuid) {
      flowFilter.agent_uuid = req.user.agent_uuid;
    } else if (req.query?.agent_uuid) {
      flowFilter.agent_uuid = req.query.agent_uuid;
    }

    const rawTimeRange = String(req.query.timeRange ?? 'all');
    if (rawTimeRange !== 'all') {
      const tf = getTimeFilter(req);
      if (tf) flowFilter.timestamp = tf;
    }

    // Parallel queries
    const [flowsQuery, rawThreats] = await Promise.all([
      Flow.find({ ...flowFilter, $or: [{ src_ip: ip }, { dst_ip: ip }] }).sort({ timestamp: -1 }).limit(1000000).lean(),
      Threat.find({ ip_address: ip, ...flowFilter }).sort({ detected_at: -1 }).lean(),
    ]);

    // Data maps
    const protocolsMap = {};
    const domainsMap = {};
    const localDevicesMap = {};

    let totalDownload = 0;
    let totalUpload = 0;
    let lastSeen = null;
    let firstSeen = null;

    const bump = (map, key, down, up, ls) => {
      if (!map[key]) map[key] = { app_label: key, download: 0, upload: 0, last_seen: ls, first_seen: ls };
      else {
        if (new Date(ls) > new Date(map[key].last_seen)) map[key].last_seen = ls;
        if (new Date(ls) < new Date(map[key].first_seen)) map[key].first_seen = ls;
      }
      map[key].download += down;
      map[key].upload   += up;
    };

    for (const f of flowsQuery) {
      let localIp = '';
      let down = f.download || 0;
      let up = f.upload || 0;
      let remoteDown = 0;
      let remoteUp = 0;

      if (f.dst_ip === ip) {
        localIp = f.src_ip;
        remoteDown = up; // Remote received what local sent
        remoteUp = down; // Remote sent what local received
      } else if (f.src_ip === ip) {
        localIp = f.dst_ip;
        remoteDown = down;
        remoteUp = up;
      }

      totalDownload += remoteDown;
      totalUpload += remoteUp;

      const ls = f.last_seen || (f.timestamp ? new Date(f.timestamp).toISOString() : new Date().toISOString());
      
      if (!lastSeen || new Date(ls) > new Date(lastSeen)) lastSeen = ls;
      if (!firstSeen || new Date(ls) < new Date(firstSeen)) firstSeen = ls;

      if (localIp) bump(localDevicesMap, localIp, remoteDown, remoteUp, ls);
      
      if (f.app_label) bump(protocolsMap, f.app_label, remoteDown, remoteUp, ls);
      else if (f.protocol) bump(protocolsMap, f.protocol, remoteDown, remoteUp, ls);
      
      const domainVal = f.sni_hostname || f.domain;
      if (domainVal) bump(domainsMap, domainVal, remoteDown, remoteUp, ls);
    }

    res.json({
      ok: true,
      data: {
        ip_address: ip,
        ip_version: ip.includes(':') ? 6 : 4,
        total_download: totalDownload,
        total_upload: totalUpload,
        last_seen: lastSeen,
        first_seen: firstSeen,
        protocols: Object.values(protocolsMap).sort((a, b) => b.download + b.upload - (a.download + a.upload)),
        domains: Object.values(domainsMap).sort((a, b) => b.download + b.upload - (a.download + a.upload)),
        local_devices: Object.values(localDevicesMap).sort((a, b) => b.download + b.upload - (a.download + a.upload)),
        flows: flowsQuery.slice(0, 100), // top 100 recent flows
        threats: rawThreats
      }
    });
  } catch (err) {
    console.error('Remote IP Details Error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};
