const { DeviceStat, Flow } = require('../../../models/Schemas');
const { getTimeFilter, getBaseFilter, getCustomLabelsMap } = require('../helpers');
const { resolveDeviceTypeFromIp, resolveOSFromIp, resolveVendorFromIp, generateAutoLabel } = require('../../../deviceResolver');
const User = require('../../../models/User');

async function getLabelingHandler(req, res) {
  try {
    const isAuthorized = req.user?.role === 'SUPER_ADMIN' ||
      req.user?.role === 'EXECUTIVE' ||
      req.user?.role === 'TENANT_ADMIN' ||
      req.user?.role === 'COMPANY_ADMIN' ||
      req.user?.role === 'COMPANY_OPERATOR' ||
      req.user?._originalRole === 'SUPER_ADMIN' ||
      req.user?._originalRole === 'TENANT_ADMIN';

    if (!isAuthorized) {
      return res.status(403).json({ ok: false, error: 'Unauthorized: Only administrators can view device labeling directory.' });
    }

    const timeFilter = getTimeFilter(req);
    const query = getBaseFilter(req, timeFilter);

    // Enforce tenant site isolation
    const isGlobalUser = req.user?.role === 'SUPER_ADMIN' ||
      req.user?.role === 'EXECUTIVE' ||
      ((!req.user?.site_uuid || req.user?.site_uuid === 'default') && ['SOC_ANALYST', 'ENGINEER'].includes(req.user?.role)) ||
      req.user?._originalRole === 'SUPER_ADMIN';

    if (!isGlobalUser && req.user?.site_uuid) {
      query.site_uuid = req.user.site_uuid;
    }

    // 1. Group by mac_address to find the latest record for each MAC in DeviceStat
    const pipeline = [
      { $match: { ...query, mac_address: { $ne: null, $ne: '-' } } },
      { $sort: { timestamp: -1 } },
      { $group: {
          _id: "$mac_address",
          ip_address: { $first: "$ip_address" },
          device_type: { $first: "$device_type" },
          manufacturer: { $first: "$manufacturer" },
          device_label: { $first: "$device_label" },
          agent_uuid: { $first: "$agent_uuid" },
          timestamp: { $first: "$timestamp" }
      }}
    ];

    // 2. Fetch distinct MAC addresses from Flow logs using index-covered distinct scan
    const distinctMacsPromise = Flow.distinct('src_mac', {
      ...query,
      src_mac: { $ne: null, $ne: '-' }
    });

    const [deviceData, distinctMacs] = await Promise.all([
      DeviceStat.aggregate(pipeline),
      distinctMacsPromise
    ]);

    // 3. Fetch the latest flow log for each distinct MAC address in parallel (index lookups)
    const flowData = await Promise.all(
      distinctMacs.map(async (mac) => {
        const latest = await Flow.findOne({
          ...query,
          src_mac: mac
        })
        .sort({ timestamp: -1 })
        .select('src_ip agent_uuid timestamp')
        .lean();

        if (!latest) return null;
        return {
          _id: mac,
          ip_address: latest.src_ip,
          agent_uuid: latest.agent_uuid,
          timestamp: latest.timestamp
        };
      })
    ).then(results => results.filter(Boolean));

    // Merge results based on MAC Address
    const mergedMap = new Map();

    // Process flow log records as baseline
    flowData.forEach(f => {
      const mac = f._id;
      mergedMap.set(mac, {
        _id: mac,
        ip_address: f.ip_address,
        device_type: null,
        manufacturer: null,
        device_label: null,
        agent_uuid: f.agent_uuid,
        timestamp: f.timestamp
      });
    });

    // Overwrite/merge with DeviceStat records
    deviceData.forEach(d => {
      const mac = d._id;
      mergedMap.set(mac, d);
    });

    const data = Array.from(mergedMap.values());

    // Fetch agent user accounts to resolve human-readable labels
    const agentUsers = await User.find({ role: 'AGENT_VIEWER' }).lean();
    const agentMap = {};
    agentUsers.forEach(u => {
      if (u.agent_uuid) {
        agentMap[u.agent_uuid] = u.account_name || u.agent_uuid;
      }
    });

    const customLabelsMap = await getCustomLabelsMap();

    const result = data.map(item => {
      const mac = item._id;
      const customLabel = customLabelsMap[mac] || null;
      const ip = item.ip_address || '-';
      const type = item.device_type && item.device_type !== '-' && item.device_type !== 'Unknown' ? item.device_type : resolveDeviceTypeFromIp(ip);
      const os = item.os_label && item.os_label !== '-' && item.os_label !== 'Unknown' ? item.os_label : resolveOSFromIp(ip);
      const man = item.manufacturer && item.manufacturer !== '-' && item.manufacturer !== 'Unknown' ? item.manufacturer : resolveVendorFromIp(ip);
      
      const baseLabel = item.device_label;
      const defaultLabel = baseLabel && baseLabel !== '-' && baseLabel !== 'Unknown' && baseLabel !== 'Generic Client'
        ? baseLabel
        : generateAutoLabel(ip, mac, man, type);

      const agentUuid = item.agent_uuid || '';
      const agentName = agentMap[agentUuid] || agentUuid || 'Unknown Agent';

      return {
        mac_address: mac,
        ip_address: ip,
        device_type: type,
        manufacturer: man,
        default_label: defaultLabel,
        custom_label: customLabel,
        agent_uuid: agentUuid,
        agent_name: agentName,
        last_seen: item.timestamp || new Date()
      };
    });

    res.json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

module.exports = getLabelingHandler;
