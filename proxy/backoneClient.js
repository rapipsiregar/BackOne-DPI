// proxy/backoneClient.js
// ─────────────────────────────────────────────────────────────────────────────
// DPI API wrapper for the BackOne Proxy Server targeting BackOne API.
// ─────────────────────────────────────────────────────────────────────────────

const { backoneFetch, BASE_URL } = require('./backoneClientCore');
const telemetry = require('./backoneTelemetry');
const stats = require('./backoneClientStats');

async function fetchFlows(limit = 500, agentUuid = null, siteUuid = null, intervalMinutes = 1440) {
  const [raw, sniRaw] = await Promise.all([
    backoneFetch('/data/flows', { settings_limit: limit, filter_interval: intervalMinutes }, agentUuid, siteUuid),
    backoneFetch('/data/stats/top/tls_sni/download', { filter_interval: intervalMinutes, settings_limit: 50 }, agentUuid, siteUuid),
  ]);
  if (!raw || !Array.isArray(raw)) return null;
  const sniList = [];
  if (sniRaw && Array.isArray(sniRaw)) {
    for (const r of sniRaw) {
      const sni = typeof r.tls_sni === 'object' ? r.tls_sni?.label : r.tls_sni;
      if (sni && typeof sni === 'string' && sni.trim() !== '') {
        sniList.push(sni.replace(/^\*\./, '').trim());
      }
    }
  }
  return raw.map(r => {
    const port = r.remote_port ?? null;
    const portService = port ? (stats.PORT_SERVICE_MAP[port] ?? `Port ${port}`) : null;
    const appLabel = r.application?.label || portService;
    const domain = r.tls_sni || r.dns_hostname || r.hostname || null;
    return {
      flow_id:    String(r.flow_id ?? ''),
      src_ip:     r.local_ip?.address  ?? null,
      src_mac:    r.local_mac          ?? null,
      dst_ip:     r.remote_ip?.address ?? null,
      dst_port:   port,
      protocol:   r.ip_protocol?.label ?? null,
      app_label:  appLabel,
      domain:     domain,
      download:   r.download ?? 0,
      upload:     r.upload   ?? 0,
      first_seen: r.first_seen_at?.date ?? null,
      last_seen:  r.last_seen_at?.date  ?? null,
    };
  }).filter(f => f.src_ip);
}

module.exports = {
  fetchFlows,
  fetchAgents: stats.fetchAgents,
  fetchBandwidthSummary: stats.fetchBandwidthSummary,
  fetchTopApps: stats.fetchTopApps,
  fetchDiscoveredDevices: stats.fetchDiscoveredDevices,
  fetchDeviceApps: stats.fetchDeviceApps,
  fetchCyberThreats: stats.fetchCyberThreats,
  fetchEvents: stats.fetchEvents,
  syncApplicationDictionary: stats.syncApplicationDictionary,
  BASE_URL,
  PORT_SERVICE_MAP: stats.PORT_SERVICE_MAP,
  ...telemetry,
};
