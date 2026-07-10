const { CustomDeviceLabel, Flow } = require('../../models/Schemas');

function getTimeFilter(req) {
  const range = req.query.timeRange || '1d';
  if (range === 'all') return null;
  const now = new Date();
  const ms = {
    '5m':  5    * 60000,
    '30m': 30   * 60000,
    '1h':  60   * 60000,
    '1d':  24   * 3600000,
    '7d':  7    * 24 * 3600000,
  };
  const delta = ms[range] ?? ms['1d'];
  return { $gte: new Date(now.getTime() - delta) };
}

function getBaseFilter(req, timeFilter = null) {
  const filter = {};
  if (timeFilter) filter.timestamp = timeFilter;
  if (req.user?.site_uuid)  filter.site_uuid  = req.user.site_uuid;
  if (req.user?.role === 'AGENT_VIEWER' && req.user?.agent_uuid) {
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
