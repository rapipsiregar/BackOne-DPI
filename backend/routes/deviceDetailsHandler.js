// backend/routes/deviceDetailsHandler.js
// ─────────────────────────────────────────────────────────────────────────────
// Device Detail Handler — reads 100% from MongoDB (no live DPI API calls)
//
// Architecture:
//  1. Total download/upload  → DeviceStat (latest, DPI API cumulative per-IP)
//  2. Apps tab               → DeviceAppStat (DPI API per-IP per-app, collected
//                               by proxy every 5min for top 30 devices)
//  3. Protocols + Domains    → Flow collection (sampled, enriched with domain map)
//  4. Network Flows tab      → Flow collection
//  5. Threats tab            → Threat collection
// ─────────────────────────────────────────────────────────────────────────────

const { DeviceStat, DeviceAppStat, Flow, Threat, CustomDeviceLabel } = require('../models/Schemas');
const User = require('../models/User');

// Domain → App label for protocol/domain tab enrichment only (NOT for apps tab)
const DOMAIN_APP_MAP = {
  'youtube.com': 'YouTube', 'googlevideo.com': 'YouTube', 'yt.be': 'YouTube',
  'facebook.com': 'Facebook', 'fbcdn.net': 'Facebook', 'instagram.com': 'Instagram',
  'whatsapp.com': 'WhatsApp', 'wa.me': 'WhatsApp',
  'tiktok.com': 'TikTok', 'tiktokv.com': 'TikTok',
  'cloudflare.com': 'Cloudflare', 'cloudflare-dns.com': 'Cloudflare',
  'google.com': 'Google', 'googleapis.com': 'Google', 'gstatic.com': 'Google',
  'microsoft.com': 'Microsoft', 'microsoftonline.com': 'Microsoft', 'windows.com': 'Microsoft',
  'office.com': 'Microsoft', 'live.com': 'Microsoft', 'azure.com': 'Microsoft',
  'netflix.com': 'Netflix', 'nflximg.net': 'Netflix',
  'twitter.com': 'X (Twitter)', 'twimg.com': 'X (Twitter)',
  'telegram.org': 'Telegram', 'telegram.me': 'Telegram',
  'zoom.us': 'Zoom', 'zoomgov.com': 'Zoom',
  'amazon.com': 'Amazon', 'amazonaws.com': 'Amazon AWS',
  'apple.com': 'Apple', 'icloud.com': 'iCloud',
  'spotify.com': 'Spotify', 'wazuh.com': 'Wazuh (Security)',
  'adobe.com': 'Adobe', 'dropbox.com': 'Dropbox',
};

function inferAppFromDomain(domain) {
  if (!domain) return null;
  const lower = domain.toLowerCase().replace(/^www\./, '');
  if (DOMAIN_APP_MAP[lower]) return DOMAIN_APP_MAP[lower];
  for (const [key, app] of Object.entries(DOMAIN_APP_MAP)) {
    if (lower.endsWith('.' + key) || lower === key) return app;
  }
  return null;
}

module.exports = async function deviceDetailsHandler(req, res, helpers) {
  const t0 = Date.now();
  try {
    const {
      getTimeFilter, getBaseFilter, generateMacFromIp,
      resolveDeviceTypeFromIp, resolveOSFromIp, resolveVendorFromIp, generateAutoLabel
    } = helpers;

    const baseFilter = getBaseFilter(req);

    let ip  = String(req.query.ip  ?? '');
    const mac = String(req.query.mac ?? '');

    if (!ip && mac) {
      const dev = await DeviceStat.findOne({ mac_address: mac, ...baseFilter }).sort({ timestamp: -1 }).lean();
      if (dev) {
        ip = dev.ip_address;
      } else {
        const flow = await Flow.findOne({ src_mac: mac, ...baseFilter }).sort({ timestamp: -1 }).lean();
        if (flow) ip = flow.src_ip;
      }
    }
    if (!ip && !mac) return res.status(400).json({ ok: false, message: 'ip or mac required' });

    // Find device stats by ip if set, else by mac
    const deviceQuery = ip ? { ip_address: ip } : { mac_address: mac };
    const device    = await DeviceStat.findOne({ ...deviceQuery, ...baseFilter }).sort({ timestamp: -1 }).lean();
    if (!ip && device?.ip_address) {
      ip = device.ip_address;
    }

    const agentUuid = baseFilter.agent_uuid || device?.agent_uuid || null;

    // ── PRIMARY bandwidth source ─────────────────────────────────────────────
    const totalDownload = device?.download || 0;
    const totalUpload   = device?.upload   || 0;

    // ── Flow filter ──────────────────────────────────────────────────────────
    const flowFilter = {};
    if (agentUuid)           flowFilter.agent_uuid = agentUuid;
    if (req.user?.site_uuid) flowFilter.site_uuid  = req.user.site_uuid;

    const rawTimeRange = String(req.query.timeRange ?? 'all');
    if (rawTimeRange !== 'all') {
      const tf = getTimeFilter(req);
      if (tf) flowFilter.timestamp = tf;
    }

    // ── Parallel queries ─────────────────────────────────────────────────────
    const flowQueryConditions = [];
    if (ip) {
      flowQueryConditions.push({ src_ip: ip }, { dst_ip: ip });
    }
    if (mac) {
      flowQueryConditions.push({ src_mac: mac }, { dst_mac: mac });
    }

    const threatQuery = {
      ...(agentUuid ? { agent_uuid: agentUuid } : {})
    };
    if (ip && mac) {
      threatQuery.$or = [{ ip_address: ip }, { mac_address: mac }, { src_mac: mac }];
    } else if (ip) {
      threatQuery.ip_address = ip;
    } else if (mac) {
      threatQuery.$or = [{ mac_address: mac }, { src_mac: mac }];
    }

    const appFilter = agentUuid ? { agent_uuid: agentUuid, ip_address: ip } : { ip_address: ip };
    if (req.user?.site_uuid) appFilter.site_uuid = req.user.site_uuid;

    const [deviceAppStats, flowsQuery, rawThreats] = await Promise.all([
      // Only query DeviceAppStat if we have an IP
      ip ? DeviceAppStat.find(appFilter).sort({ timestamp: -1 }).lean() : [],
      flowQueryConditions.length > 0
        ? Flow.find({ ...flowFilter, $or: flowQueryConditions }).sort({ timestamp: -1 }).limit(2000).lean()
        : [],
      Threat.find(threatQuery).sort({ detected_at: -1 }).lean(),
    ]);

    // ── Apps tab — use DeviceAppStat (real DPI per-IP per-app data) ──────────
    // Deduplicate: same app_label may appear across multiple collection cycles
    // Use the LATEST record per app (most recent 24h cumulative value)
    const appLatest = {};
    for (const a of deviceAppStats) {
      const key = a.app_label;
      if (!appLatest[key] || new Date(a.timestamp) > new Date(appLatest[key].timestamp)) {
        appLatest[key] = a;
      }
    }
    const apps = Object.values(appLatest)
      .filter(a => (a.download || 0) + (a.upload || 0) > 0)
      .sort((a, b) => (b.download || 0) - (a.download || 0))
      .map(a => ({
        app_label:  a.app_label,
        download:   a.download  || 0,
        upload:     a.upload    || 0,
        flows:      a.flows     || 0,
        first_seen: a.created_at || a.timestamp,
        last_seen:  a.updated_at || a.timestamp,
      }));

    // ── Protocol / Domain tabs — from Flow collection ────────────────────────
    const protocolsMap = {}, domainsMap = {}, destinationsMap = {};
    const bump = (map, key, down, up, ls) => {
      if (!map[key]) map[key] = { app_label: key, download: 0, upload: 0, last_seen: ls };
      else if (new Date(ls) > new Date(map[key].last_seen)) map[key].last_seen = ls;
      map[key].download += down;
      map[key].upload   += up;
    };

    for (const f of flowsQuery) {
      const isOutbound = ip ? (f.src_ip === ip) : (mac ? (f.src_mac === mac) : false);
      if (!isOutbound) continue; // outbound only
      const down = f.download || 0;
      const up   = f.upload   || 0;
      const ls   = f.last_seen || (f.timestamp ? new Date(f.timestamp).toISOString() : new Date().toISOString());

      if (f.app_label) bump(protocolsMap, f.app_label, down, up, ls);
      else if (f.protocol) bump(protocolsMap, f.protocol, down, up, ls);
      
      const domainVal = f.sni_hostname || f.domain;
      if (domainVal) bump(domainsMap, domainVal, down, up, ls);
      if (f.dst_ip) bump(destinationsMap, f.dst_ip, down, up, ls);
    }

    // ── Device metadata ───────────────────────────────────────────────────────
    const targetMac  = device?.mac_address || mac || generateMacFromIp(ip);
    const type       = (device?.device_type && !['−', 'Unknown', '-'].includes(device.device_type)) ? device.device_type : resolveDeviceTypeFromIp(ip);
    const man        = (device?.manufacturer && !['−', 'Unknown', '-'].includes(device.manufacturer)) ? device.manufacturer : resolveVendorFromIp(ip);
    const os         = (device?.os_label && !['−', 'Unknown', '-'].includes(device.os_label)) ? device.os_label : resolveOSFromIp(ip);
    const lastSeen   = device?.last_seen || device?.timestamp || new Date().toISOString();

    const customLabelDoc = await CustomDeviceLabel.findOne({ mac_address: targetMac }).lean();
    const baseLabel  = customLabelDoc?.device_label || device?.device_label;
    const finalLabel = baseLabel && !['−', 'Unknown', 'Generic Client', '-'].includes(baseLabel)
                        ? baseLabel : generateAutoLabel(ip, targetMac, man, type);

    let agent_label = agentUuid;
    if (agentUuid) {
      const agentUser = await User.findOne({ agent_uuid: agentUuid, role: 'AGENT_VIEWER' }).lean();
      if (agentUser?.account_name) agent_label = agentUser.account_name;
    }

    const threats = rawThreats.map(t => ({
      id:          t._id?.toString(),
      threat_type: t.threat_type,
      severity:    t.severity,
      ip_address:  t.ip_address || t.src_ip,
      dst_ip:      t.dst_ip,
      mac_address: t.mac_address || t.src_mac || null,
      app_label:   t.app_label  || null,
      domain:      t.domain     || null,
      detected_at: t.detected_at || t.timestamp,
      description: t.description || `Suspicious activity detected from ${t.ip_address || t.src_ip}`,
      agent_uuid:  t.agent_uuid,
    }));

    const flows = flowsQuery
      .filter(f => ip ? (f.src_ip === ip) : (mac ? (f.src_mac === mac) : false))
      .map(f => ({
        flow_id:   f.flow_id   || f._id.toString(),
        src_ip:    f.src_ip,
        dst_ip:    f.dst_ip,
        dst_port:  f.dst_port,
        protocol:  f.protocol,
        app_label: inferAppFromDomain(f.sni_hostname || f.domain) || f.app_label || 'Other',
        domain:    f.sni_hostname || f.domain || null,
        download:  f.download  || 0,
        upload:    f.upload    || 0,
        last_seen: f.last_seen || (f.timestamp ? new Date(f.timestamp).toISOString() : null),
      }));

    const elapsed = Date.now() - t0;
    console.log(`[DeviceDetails] ip=${ip} agent=${agentUuid} appsFromDB=${apps.length} flows=${flowsQuery.length} dl=${(totalDownload/1e9).toFixed(2)}GB time=${elapsed}ms`);

    return res.json({
      ok: true,
      data: {
        ip_address:     ip,
        mac_address:    targetMac,
        device_label:   finalLabel,
        device_type:    type,
        os_label:       os,
        manufacturer:   man,
        last_seen:      lastSeen,
        total_download: totalDownload,
        total_upload:   totalUpload,
        agent_uuid:     agentUuid,
        agent_label,
        flows,
        apps,
        protocols:    Object.values(protocolsMap).sort((a, b) => b.download - a.download),
        domains:      Object.values(domainsMap).sort((a, b) => b.download - a.download),
        destinations: Object.values(destinationsMap).sort((a, b) => b.download - a.download),
        threats,
      },
    });
  } catch (err) {
    console.error('[DeviceDetailsHandler] Error:', err);
    return res.status(500).json({ ok: false, message: err.message });
  }
};
