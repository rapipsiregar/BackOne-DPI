// proxy/backoneClientStats.js
// ─────────────────────────────────────────────────────────────────────────────
// Supplementary fetchers split from backoneClient.js to satisfy the 256-line limit.
// ─────────────────────────────────────────────────────────────────────────────

const { backoneFetch } = require('./backoneClientCore');
const { fetchAgents } = require('./backoneAgentFetcher');

const PORT_SERVICE_MAP = {
  80: 'HTTP', 443: 'HTTPS / TLS', 8080: 'HTTP Alt', 8443: 'HTTPS Alt',
  53: 'DNS', 5353: 'mDNS', 853: 'DNS-over-TLS',
  25: 'SMTP', 587: 'SMTP TLS', 465: 'SMTPS', 110: 'POP3', 143: 'IMAP',
  22: 'SSH', 23: 'Telnet', 3389: 'RDP', 5900: 'VNC',
  21: 'FTP', 20: 'FTP Data', 989: 'FTPS', 990: 'FTPS Control',
  3306: 'MySQL', 5432: 'PostgreSQL', 6379: 'Redis', 27017: 'MongoDB',
  1194: 'OpenVPN', 51820: 'WireGuard', 500: 'IPSec IKE', 4500: 'IPSec NAT-T',
  67: 'DHCP', 68: 'DHCP Client', 123: 'NTP',
  6881: 'BitTorrent', 6882: 'BitTorrent', 6883: 'BitTorrent',
  9993: 'ZeroTier VPN',
};

async function fetchBandwidthSummary(interval = 1440, agentUuid = null, siteUuid = null) {
  const [dlData, ulData, flowsData] = await Promise.all([
    backoneFetch('/data/stats/top/local_ip/download', { filter_interval: interval, settings_limit: 500 }, agentUuid, siteUuid),
    backoneFetch('/data/stats/top/local_ip/upload', { filter_interval: interval, settings_limit: 500 }, agentUuid, siteUuid),
    backoneFetch('/data/stats/top/local_ip/flow_count', { filter_interval: interval, settings_limit: 500 }, agentUuid, siteUuid),
  ]);
  const bandwidth_down = dlData?.reduce((s, r) => s + (r.download ?? 0), 0) ?? 0;
  const bandwidth_up   = ulData?.reduce((s, r) => s + (r.upload ?? 0), 0) ?? 0;
  const total_devices  = dlData?.length ?? 0;
  const active_flows   = flowsData?.reduce((s, r) => s + (r.flows ?? r.flow_count ?? 0), 0) ?? 0;
  return { bandwidth_down, bandwidth_up, total_devices, active_flows, total_threats: 0 };
}

async function fetchTopApps(interval = 1440, limit = 200, agentUuid = null, siteUuid = null) {
  const [dlData, ulData] = await Promise.all([
    backoneFetch('/data/stats/top/application/download', { filter_interval: interval, settings_limit: limit }, agentUuid, siteUuid),
    backoneFetch('/data/stats/top/application/upload', { filter_interval: interval, settings_limit: limit }, agentUuid, siteUuid),
  ]);
  if (!dlData) return null;
  const ulMap = {};
  if (ulData) {
    for (const r of ulData) {
      const id = r.application?.id;
      if (id) ulMap[id] = r.upload ?? 0;
    }
  }
  return dlData.map(r => ({
    application: { id: r.application?.id ?? null, label: r.application?.label ?? 'Unknown', tag: r.application?.tag ?? null },
    download: r.download ?? 0, upload: ulMap[r.application?.id] ?? 0, flows: r.flows ?? 0,
  }));
}

async function fetchDiscoveredDevices(interval = 1440, limit = 500, agentUuid = null, siteUuid = null) {
  const [dlData, ulData] = await Promise.all([
    backoneFetch('/data/stats/top/local_ip/download', { filter_interval: interval, settings_limit: limit }, agentUuid, siteUuid),
    backoneFetch('/data/stats/top/local_ip/upload', { filter_interval: interval, settings_limit: limit }, agentUuid, siteUuid),
  ]);
  if (!dlData) return null;
  const ulMap = {};
  if (ulData) {
    for (const r of ulData) {
      const ip = r.local_ip?.address ?? String(r.local_ip);
      ulMap[ip] = r.upload ?? 0;
    }
  }
  return dlData.map(r => {
    const ip = r.local_ip?.address ?? String(r.local_ip ?? '');
    return {
      ip_address: ip, mac_address: r.local_mac ?? null, device_label: r.device_label ?? ip, device_type: r.device_type ?? null,
      os_label: r.os_label ?? null, manufacturer: r.manufacturer ?? null, download: r.download ?? 0, upload: ulMap[ip] ?? 0,
      flows: r.flows ?? 0, last_seen: r.last_seen_at?.date ?? null,
    };
  }).filter(d => d.ip_address);
}

async function fetchDeviceApps(ipAddress, interval = 1440, limit = 50, agentUuid = null, siteUuid = null) {
  const ipFilter = JSON.stringify([ipAddress]);
  const [dlData, ulData] = await Promise.all([
    backoneFetch('/data/stats/top/application/download', { filter_interval: interval, settings_limit: limit, filter_local_ips: ipFilter }, agentUuid, siteUuid),
    backoneFetch('/data/stats/top/application/upload', { filter_interval: interval, settings_limit: limit, filter_local_ips: ipFilter }, agentUuid, siteUuid),
  ]);
  if (!dlData || !Array.isArray(dlData)) return [];
  const ulMap = {};
  if (ulData && Array.isArray(ulData)) {
    for (const r of ulData) {
      const id = r.application?.id;
      if (id) ulMap[id] = r.upload ?? 0;
    }
  }
  return dlData.map(r => ({
    app_label: r.application?.label ?? 'Unknown',
    app_id:    r.application?.id    ?? null,
    download:  r.download ?? 0,
    upload:    ulMap[r.application?.id] ?? 0,
    flows:     r.flows ?? 0,
  })).filter(a => a.download > 0 || a.upload > 0);
}

async function fetchCyberThreats(agentUuid = null, siteUuid = null) {
  const ipRepData = await backoneFetch('/data/stats/top/remote_ip/download', { filter_interval: 1440, settings_limit: 50 }, agentUuid, siteUuid);
  if (!ipRepData || !Array.isArray(ipRepData)) return [];
  const SUSPICIOUS_PORTS = new Set([23, 4444, 1337, 6667, 31337, 12345, 54321, 4899, 5554, 9999]);
  const threats = [];
  for (const r of ipRepData) {
    const ip   = r.remote_ip?.address ?? null;
    const port = r.remote_port ?? 0;
    if (ip && SUSPICIOUS_PORTS.has(port)) {
      threats.push({
        threat_type: `Suspicious Port ${port}`,
        severity:    'High',
        src_ip:      null,
        dst_ip:      ip,
        dst_port:    port,
        protocol:    r.ip_protocol?.label ?? null,
        description: `Suspicious outbound connection to ${ip}:${port}`,
        event_at:    new Date().toISOString(),
      });
    }
  }
  return threats;
}

async function fetchEvents(limit = 100, agentUuid = null, siteUuid = null) {
  const raw = await backoneFetch('/event/events', { settings_limit: limit }, agentUuid, siteUuid);
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map(r => {
    let msg = r.label || '';
    if (r.description) {
      try {
        const descObj = JSON.parse(r.description);
        msg = descObj.default || r.label || '';
        if (descObj.tags) {
          for (const k in descObj.tags) {
            const tagVal = descObj.tags[k];
            const val = Array.isArray(tagVal) ? (tagVal[0] === 'Unknown' && tagVal[1] ? tagVal[1] : tagVal[0]) : tagVal;
            msg = msg.replace(`{{ ${k} }}`, val).replace(`{{${k}}}`, val);
          }
        }
      } catch (e) {
        msg = r.description;
      }
    }
    let sevLabel = 'Info';
    if (r.severity >= 30) sevLabel = 'Critical';
    else if (r.severity >= 20) sevLabel = 'High';
    else if (r.severity >= 10) sevLabel = 'Warning';
    let srcIp = null;
    if (r.description) {
      try {
        const descObj = JSON.parse(r.description);
        srcIp = descObj.tags?.device_ip || descObj.tags?.ip || null;
      } catch {}
    }
    return {
      event_id:       r.id || null,
      event_type:     r.basename || 'unknown',
      severity:       sevLabel,
      description:    msg,
      category_label: r.category?.label || 'Intelligence',
      ip_address:     srcIp,
      mac_address:    r.additional?.device?.mac?.address || null,
      event_at:       r.created_at?.date ? new Date(r.created_at.date) : new Date()
    };
  });
}

async function syncApplicationDictionary() {
  const mongoose = require('mongoose');
  const { LookupApp } = require('./models/Schemas');
  
  console.log('[BackOne] Fetching application catalog...');
  const allApps = await backoneFetch('/lookup/applications', { settings_limit: 5000 });
  if (!allApps || !Array.isArray(allApps)) {
    console.error('[BackOne] Failed to fetch application dictionary.');
    return;
  }
  
  console.log(`[BackOne] Application catalog fetched successfully. Got ${allApps.length} apps.`);
  if (allApps.length === 0) return;
  
  console.log(`[BackOne] Syncing ${allApps.length} application definitions to MongoDB...`);
  await LookupApp.deleteMany({});
  
  const batchSize = 100;
  for (let i = 0; i < allApps.length; i += batchSize) {
    const batch = allApps.slice(i, i + batchSize);
    await LookupApp.insertMany(batch.map(app => ({
      id: app.id,
      name: app.name,
      label: app.label,
      tag: app.tag,
      description: app.description,
      full_name: app.full_name || app.application?.full_label || null,
      favicon: app.favicon || app.application?.favicon || null,
      icon: app.icon || app.application?.icon || null,
      logo: app.logo || app.application?.logo || null,
      application_category: {
        id: app.application_category?.id,
        name: app.application_category?.name,
        label: app.application_category?.label,
        tag: app.application_category?.tag
      }
    })));
  }
  console.log('[BackOne] ✓ Application dictionary sync completed.');
}

module.exports = {
  fetchAgents,
  fetchBandwidthSummary,
  fetchTopApps,
  fetchDiscoveredDevices,
  fetchDeviceApps,
  fetchCyberThreats,
  fetchEvents,
  syncApplicationDictionary,
  PORT_SERVICE_MAP
};
