const { DeviceStat, Flow } = require('../../../models/Schemas');

async function getMacDetailsHandler(req, res) {
  try {
    const isAuthorized = req.user?.role === 'SUPER_ADMIN' ||
      req.user?.role === 'EXECUTIVE' ||
      req.user?.role === 'TENANT_ADMIN' ||
      req.user?.role === 'COMPANY_ADMIN' ||
      req.user?.role === 'COMPANY_OPERATOR' ||
      req.user?._originalRole === 'SUPER_ADMIN' ||
      req.user?._originalRole === 'TENANT_ADMIN';

    if (!isAuthorized) {
      return res.status(403).json({ ok: false, error: 'Unauthorized: Access denied.' });
    }

    const { mac } = req.query;
    if (!mac) return res.status(400).json({ ok: false, error: 'mac parameter required' });

    // Enforce tenant site isolation
    const query = { src_mac: mac };
    const deviceQuery = { mac_address: mac };

    const isGlobalUser = req.user?.role === 'SUPER_ADMIN' ||
      req.user?.role === 'EXECUTIVE' ||
      ((!req.user?.site_uuid || req.user?.site_uuid === 'default') && ['SOC_ANALYST', 'ENGINEER'].includes(req.user?.role)) ||
      req.user?._originalRole === 'SUPER_ADMIN';

    if (!isGlobalUser && req.user?.site_uuid) {
      query.site_uuid = req.user.site_uuid;
      deviceQuery.site_uuid = req.user.site_uuid;
    }

    // 1. Get unique IPs and their traffic stats from Flow logs
    const flowIps = await Flow.aggregate([
      { $match: query },
      { $group: {
          _id: "$src_ip",
          first_seen: { $min: "$timestamp" },
          last_seen: { $max: "$timestamp" },
          download: { $sum: { $ifNull: ["$download", 0] } },
          upload: { $sum: { $ifNull: ["$upload", 0] } },
          flows: { $sum: 1 }
      }},
      { $sort: { last_seen: -1 } }
    ]);

    // 2. Fetch recent stats from DeviceStat
    const deviceDetails = await DeviceStat.find(deviceQuery)
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    res.json({
      ok: true,
      mac_address: mac,
      ips: flowIps.map(item => ({
        ip_address: item._id,
        first_seen: item.first_seen,
        last_seen: item.last_seen,
        download: item.download || 0,
        upload: item.upload || 0,
        flows: item.flows || 0
      })),
      deviceDetails: deviceDetails
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

module.exports = getMacDetailsHandler;
