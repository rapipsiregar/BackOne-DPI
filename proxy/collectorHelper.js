// proxy/collectorHelper.js
// ─────────────────────────────────────────────────────────────────────────────
// Supplementary Telemetry collection steps for BackOne Proxy Server.
// Split from collector.js to satisfy the 256-line file size limit.
// ─────────────────────────────────────────────────────────────────────────────

const {
  AppCategoryStat,
  TlsVersionStat,
  TlsCipherStat,
  TlsSecurityStat,
  CountryStat,
  ProtocolStat,
  SslSubjectAltNameStat,
  SniHostnameStat,
  SslServerCnStat,
  QuicHostnameStat,
} = require('./models/Schemas');

async function collectSecondaryTelemetry(agentUuid, timestamp, SITE_UUID, netify, label) {
  try {
    // 2b. App Categories
    const categories = await netify.fetchTopAppCategories(1440, 50, agentUuid, SITE_UUID);
    if (categories && categories.length > 0) {
      const catDocs = categories.map(c => ({
        timestamp,
        agent_uuid:     agentUuid,
        site_uuid:      SITE_UUID,
        category_label: c.category_label,
        download:       c.download || 0,
        upload:         c.upload || 0,
        flows:          c.flows || 0,
      }));
      await AppCategoryStat.insertMany(catDocs);
      console.log(`[Collector]   ✓ ${catDocs.length} categories saved for ${label}`);
    }

    // 2c. TLS Versions
    const tlsVersions = await netify.fetchTlsVersions(1440, 50, agentUuid, SITE_UUID);
    if (tlsVersions && tlsVersions.length > 0) {
      const tvDocs = tlsVersions.map(v => ({
        timestamp,
        agent_uuid:   agentUuid,
        site_uuid:    SITE_UUID,
        tls_version:  v.tls_version,
        download:     v.download || 0,
        upload:       v.upload || 0,
        flows:        v.flows || 0,
      }));
      await TlsVersionStat.insertMany(tvDocs);
      console.log(`[Collector]   ✓ ${tvDocs.length} TLS versions saved for ${label}`);
    }

    // 2d. TLS Ciphers
    const tlsCiphers = await netify.fetchTlsCiphers(1440, 50, agentUuid, SITE_UUID);
    if (tlsCiphers && tlsCiphers.length > 0) {
      const tcDocs = tlsCiphers.map(c => ({
        timestamp,
        agent_uuid:   agentUuid,
        site_uuid:    SITE_UUID,
        tls_cipher:   c.tls_cipher,
        download:     c.download || 0,
        upload:       c.upload || 0,
        flows:        c.flows || 0,
      }));
      await TlsCipherStat.insertMany(tcDocs);
      console.log(`[Collector]   ✓ ${tcDocs.length} TLS ciphers saved for ${label}`);
    }

    // 2e. TLS Security
    const tlsSecurity = await netify.fetchTlsSecurity(1440, 50, agentUuid, SITE_UUID);
    if (tlsSecurity && tlsSecurity.length > 0) {
      const tsDocs = tlsSecurity.map(s => ({
        timestamp,
        agent_uuid:   agentUuid,
        site_uuid:    SITE_UUID,
        tls_security: s.tls_security,
        download:     s.download || 0,
        upload:       s.upload || 0,
        flows:        s.flows || 0,
      }));
      await TlsSecurityStat.insertMany(tsDocs);
      console.log(`[Collector]   ✓ ${tsDocs.length} TLS security stats saved for ${label}`);
    }

    // 2f. Top Countries
    const countries = await netify.fetchTopCountries(1440, 100, agentUuid, SITE_UUID);
    if (countries && countries.length > 0) {
      const coDocs = countries.map(c => ({
        timestamp,
        agent_uuid:   agentUuid,
        site_uuid:    SITE_UUID,
        country_code: c.country_code,
        country_name: c.country_name || '',
        download:     c.download || 0,
        upload:       c.upload   || 0,
        flows:        c.flows    || 0,
      }));
      await CountryStat.insertMany(coDocs);
      console.log(`[Collector]   ✓ ${coDocs.length} countries saved for ${label}`);
    }

    // 2g. Top Protocols
    const protocols = await netify.fetchTopProtocols(1440, 50, agentUuid, SITE_UUID);
    if (protocols && protocols.length > 0) {
      const protoDocs = protocols.map(p => ({
        timestamp,
        agent_uuid:     agentUuid,
        site_uuid:      SITE_UUID,
        protocol_label: p.protocol_label,
        download:       p.download || 0,
        upload:         p.upload || 0,
        flows:          p.flows || 0,
      }));
      await ProtocolStat.insertMany(protoDocs);
      console.log(`[Collector]   ✓ ${protoDocs.length} protocols saved for ${label}`);
    }

    // 2h. SNI Hostnames
    const snis = await netify.fetchSniHostnames(1440, 10000, agentUuid, SITE_UUID);
    if (snis && snis.length > 0) {
      const sniDocs = snis.map(s => ({
        timestamp, agent_uuid: agentUuid, site_uuid: SITE_UUID,
        sni_hostname: (s.sni_hostname && String(s.sni_hostname).trim() !== '') ? s.sni_hostname : 'Unknown',
        download: s.download || 0, upload: s.upload || 0, flows: s.flows || 0,
      }));
      await SniHostnameStat.insertMany(sniDocs);
      console.log(`[Collector]   ✓ ${sniDocs.length} SNI hostnames saved for ${label}`);
    }

    /* -- COMMENTED OUT DUE TO NETIFY API HTTP 422 (UNSUPPORTED TIER) --
    // 2i. SSL Server Common Names
    const cns = await netify.fetchSslServerCn(1440, 50, agentUuid);
    if (cns && cns.length > 0) {
      const cnDocs = cns.map(c => ({
        timestamp, agent_uuid: agentUuid, site_uuid: SITE_UUID,
        ssl_server_cn: c.ssl_server_cn, download: c.download || 0, upload: c.upload || 0, flows: c.flows || 0,
      }));
      await SslServerCnStat.insertMany(cnDocs);
      console.log(`[Collector]   ✓ ${cnDocs.length} SSL Server CNs saved for ${label}`);
    }

    // 2j. QUIC Hostnames
    const quics = await netify.fetchQuicHostnames(1440, 50, agentUuid);
    if (quics && quics.length > 0) {
      const quicDocs = quics.map(q => ({
        timestamp, agent_uuid: agentUuid, site_uuid: SITE_UUID,
        quic_hostname: q.quic_hostname, download: q.download || 0, upload: q.upload || 0, flows: q.flows || 0,
      }));
      await QuicHostnameStat.insertMany(quicDocs);
      console.log(`[Collector]   ✓ ${quicDocs.length} QUIC hostnames saved for ${label}`);
    }
    */

    // NOTE: The following API fields are not supported on this subscription (HTTP 422):
    //   dhcp_class, http_useragent, bittorrent_info_hash, ssl_subject_alt_name
    // These sections are intentionally skipped to avoid wasted API calls.
    // Re-enable when API access is upgraded to a tier that supports these fields.

  } catch (err) {
    console.error(`[CollectorHelper] Error saving secondary telemetry:`, err.message);
  }
}

module.exports = {
  collectSecondaryTelemetry,
};
