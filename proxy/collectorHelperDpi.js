// proxy/collectorHelperDpi.js
// ─────────────────────────────────────────────────────────────────────────────
// DPI Property Telemetry collection steps for BackOne Proxy Server.
// Split from collectorHelper.js to satisfy the 256-line file size limit.
// Covers: SNI Hostnames, SSL CN, QUIC, SSH Clients/Servers, mDNS Hostnames.
// ─────────────────────────────────────────────────────────────────────────────

const {
  SniHostnameStat,
  SslServerCnStat,
  QuicHostnameStat,
  SshClientStat,
  SshServerStat,
  MdnsHostnameStat,
} = require('./models/SchemasTelemetry');

async function collectDpiPropertyTelemetry(agentUuid, timestamp, SITE_UUID, netify, label) {
  try {
    // 2j. HTTPS SNI Hostnames
    const sniHostnames = await netify.fetchSniHostnames(1440, 50, agentUuid);
    if (sniHostnames && sniHostnames.length > 0) {
      const docs = sniHostnames.map(d => ({
        timestamp,
        agent_uuid:   agentUuid,
        site_uuid:    SITE_UUID,
        sni_hostname: d.sni_hostname,
        download:     d.download || 0,
        upload:       d.upload || 0,
        flows:        d.flows || 0,
      }));
      await SniHostnameStat.insertMany(docs);
      console.log(`[Collector]   ✓ ${docs.length} SNI hostnames saved for ${label}`);
    }

    // 2k. SSL Server Common Names
    const sslCns = await netify.fetchSslServerCn(1440, 50, agentUuid);
    if (sslCns && sslCns.length > 0) {
      const docs = sslCns.map(d => ({
        timestamp,
        agent_uuid:   agentUuid,
        site_uuid:    SITE_UUID,
        ssl_server_cn: d.ssl_server_cn,
        download:     d.download || 0,
        upload:       d.upload || 0,
        flows:        d.flows || 0,
      }));
      await SslServerCnStat.insertMany(docs);
      console.log(`[Collector]   ✓ ${docs.length} SSL Common Names saved for ${label}`);
    }

    // 2l. QUIC Hostnames
    const quicHostnames = await netify.fetchQuicHostnames(1440, 50, agentUuid);
    if (quicHostnames && quicHostnames.length > 0) {
      const docs = quicHostnames.map(d => ({
        timestamp,
        agent_uuid:    agentUuid,
        site_uuid:     SITE_UUID,
        quic_hostname: d.quic_hostname,
        download:      d.download || 0,
        upload:        d.upload || 0,
        flows:         d.flows || 0,
      }));
      await QuicHostnameStat.insertMany(docs);
      console.log(`[Collector]   ✓ ${docs.length} QUIC hostnames saved for ${label}`);
    }

    // 2m. SSH Clients
    const sshClients = await netify.fetchSshClients(1440, 50, agentUuid);
    if (sshClients && sshClients.length > 0) {
      const docs = sshClients.map(d => ({
        timestamp,
        agent_uuid:  agentUuid,
        site_uuid:   SITE_UUID,
        ssh_client:  d.ssh_client,
        download:    d.download || 0,
        upload:      d.upload || 0,
        flows:       d.flows || 0,
      }));
      await SshClientStat.insertMany(docs);
      console.log(`[Collector]   ✓ ${docs.length} SSH clients saved for ${label}`);
    }

    // 2n. SSH Servers
    const sshServers = await netify.fetchSshServers(1440, 50, agentUuid);
    if (sshServers && sshServers.length > 0) {
      const docs = sshServers.map(d => ({
        timestamp,
        agent_uuid: agentUuid,
        site_uuid:  SITE_UUID,
        ssh_server: d.ssh_server,
        download:   d.download || 0,
        upload:     d.upload || 0,
        flows:      d.flows || 0,
      }));
      await SshServerStat.insertMany(docs);
      console.log(`[Collector]   ✓ ${docs.length} SSH servers saved for ${label}`);
    }

    // 2o. mDNS Hostnames
    const mdnsHostnames = await netify.fetchMdnsHostnames(1440, 50, agentUuid);
    if (mdnsHostnames && mdnsHostnames.length > 0) {
      const docs = mdnsHostnames.map(d => ({
        timestamp,
        agent_uuid:    agentUuid,
        site_uuid:     SITE_UUID,
        mdns_hostname: d.mdns_hostname,
        download:      d.download || 0,
        upload:        d.upload || 0,
        flows:         d.flows || 0,
      }));
      await MdnsHostnameStat.insertMany(docs);
      console.log(`[Collector]   ✓ ${docs.length} mDNS hostnames saved for ${label}`);
    }
  } catch (err) {
    console.error(`[CollectorHelperDpi] Error saving DPI property telemetry:`, err.message);
  }
}

module.exports = {
  collectDpiPropertyTelemetry,
};
