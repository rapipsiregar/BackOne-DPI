const { CustomDeviceLabel, Flow } = require('../../models/Schemas');

function getTimeFilter(req) {
  // Explicit calendar date range (from the per-page date picker) takes priority
  // over the global sidebar time range. Both dates are interpreted as WIB (UTC+7)
  // to match the dashboard's display timezone (Rule 20).
  const dateFrom = req.query.date_from;
  const dateTo   = req.query.date_to;
  if (dateFrom || dateTo) {
    const filter = {};
    if (dateFrom) filter.$gte = new Date(`${dateFrom}T00:00:00.000+07:00`);
    if (dateTo)   filter.$lte = new Date(`${dateTo}T23:59:59.999+07:00`);
    return filter;
  }

  // Fall back to sidebar global time range
  const range = req.query.timeRange || '1d';
  if (range === 'all') return null;
  const now = new Date();
  const ms = {
    '5m':  5    * 60000,
    '30m': 30   * 60000,
    '1h':  1    * 3600000,
    '1d':  24   * 3600000,
    '7d':  7    * 24 * 3600000,
    '30d': 30   * 24 * 3600000,
  };
  const delta = ms[range] ?? ms['1d'];
  return { $gte: new Date(now.getTime() - delta) };
}


function getBaseFilter(req, timeFilter = null) {
  const filter = {};
  if (timeFilter) filter.timestamp = timeFilter;
  
  const requestedSiteUuid = req.headers['x-backone-site-uuid'];
  
  const isGlobalUser = req.user?.role === 'SUPER_ADMIN' ||
    req.user?.role === 'EXECUTIVE' ||
    ((!req.user?.site_uuid || req.user?.site_uuid === 'default') && ['SOC_ANALYST', 'ENGINEER'].includes(req.user?.role));
  
  if (isGlobalUser && requestedSiteUuid) {
    filter.site_uuid = requestedSiteUuid;
  } else if (req.user?.site_uuid) {
    filter.site_uuid = req.user.site_uuid;
  }

  // Company-based roles: restrict to their assigned list of agents
  if (req.user?.role && ['COMPANY_ADMIN', 'COMPANY_OPERATOR', 'COMPANY_VIEWER'].includes(req.user.role)) {
    filter.agent_uuid = { $in: req.user.agent_uuids || [] };
  } else if (req.user?.role === 'AGENT_VIEWER' && req.user?.agent_uuid) {
    filter.agent_uuid = req.user.agent_uuid;
  } else if (req.query?.agent_uuid) {
    filter.agent_uuid = req.query.agent_uuid;
  }
  return filter;
}

async function getCustomLabelsMap() {
  try {
    const list = await CustomDeviceLabel.find().lean();
    const map = {};
    list.forEach(c => {
      map[c.mac_address] = c.device_label;
    });
    return map;
  } catch (err) {
    console.error('[getCustomLabelsMap] failed:', err.message);
    return {};
  }
}

async function topFlowField(fieldName, req, limit = 20) {
  const timeFilter = getTimeFilter(req);
  const matchBase  = getBaseFilter(req, timeFilter);

  return Flow.aggregate([
    { $match: { ...matchBase, [fieldName]: { $ne: null, $ne: '' } } },
    { $group: {
        _id:      `$${fieldName}`,
        download: { $sum: '$download' },
        upload:   { $sum: '$upload' },
        count:    { $sum: 1 },
    }},
    { $project: { label: '$_id', download: 1, upload: 1, count: 1, _id: 0 } },
    { $sort: { download: -1 } },
    { $limit: limit },
  ]);
}

module.exports = {
  getTimeFilter,
  getBaseFilter,
  getCustomLabelsMap,
  topFlowField
};
