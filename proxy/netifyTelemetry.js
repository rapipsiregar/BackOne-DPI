// proxy/netifyTelemetry.js
// ─────────────────────────────────────────────────────────────────────────────
// Supplementary Telemetry endpoints wrapper for BackOne Proxy Server
// Split from netifyClient.js to strictly respect the 256-line file size limit.
// ─────────────────────────────────────────────────────────────────────────────

const { netifyFetch } = require('./netifyClientCore');

async function fetchTopAppCategories(interval = 1440, limit = 15, agentUuid = null, siteUuid = null) {
  const [dlData, ulData] = await Promise.all([
    netifyFetch('/data/stats/top/application_category/download', { filter_interval: interval, settings_limit: limit }, agentUuid, siteUuid),
    netifyFetch('/data/stats/top/application_category/upload', { filter_interval: interval, settings_limit: limit }, agentUuid, siteUuid),
  ]);
  if (!dlData) return [];
  const ulMap = {};
  if (ulData) {
    for (const r of ulData) {
      const key = r.application_category?.label ?? r.application_category;
      if (key) ulMap[key] = r.upload ?? 0;
    }
  }
  return dlData.map(r => {
    const label = r.application_category?.label ?? String(r.application_category ?? 'Unknown');
    return {
      category_label : label,
      download       : r.download ?? 0,
      upload         : ulMap[label] ?? 0,
      flows          : r.flows ?? 0,
    };
  });
}

async function fetchTlsVersions(interval = 1440, limit = 15, agentUuid = null, siteUuid = null) {
  const [dlData, ulData] = await Promise.all([
    netifyFetch('/data/stats/top/tls_version/download', { filter_interval: interval, settings_limit: limit }, agentUuid, siteUuid),
    netifyFetch('/data/stats/top/tls_version/upload', { filter_interval: interval, settings_limit: limit }, agentUuid, siteUuid),
  ]);
  if (!dlData) return [];
  const ulMap = {};
  if (ulData) {
    for (const r of ulData) {
      const key = r.tls_version?.label ?? r.tls_version?.code ?? r.tls_version;
      if (key) ulMap[key] = r.upload ?? 0;
    }
  }
  return dlData.map(r => {
    const label = r.tls_version?.label ?? r.tls_version?.code ?? String(r.tls_version ?? 'Unknown');
    return {
      tls_version : label,
      download    : r.download ?? 0,
      upload      : ulMap[label] ?? 0,
      flows       : r.flows ?? 0,
    };
  });
}

async function fetchTlsCiphers(interval = 1440, limit = 15, agentUuid = null, siteUuid = null) {
  const [dlData, ulData] = await Promise.all([
    netifyFetch('/data/stats/top/tls_cipher/download', { filter_interval: interval, settings_limit: limit }, agentUuid, siteUuid),
    netifyFetch('/data/stats/top/tls_cipher/upload', { filter_interval: interval, settings_limit: limit }, agentUuid, siteUuid),
  ]);
  if (!dlData) return [];
  const ulMap = {};
  if (ulData) {
    for (const r of ulData) {
      const key = r.tls_cipher?.label ?? r.tls_cipher?.code ?? r.tls_cipher;
      if (key) ulMap[key] = r.upload ?? 0;
    }
  }
  return dlData.map(r => {
    const label = r.tls_cipher?.label ?? r.tls_cipher?.code ?? String(r.tls_cipher ?? 'Unknown');
    return {
      tls_cipher : label,
      download   : r.download ?? 0,
      upload     : ulMap[label] ?? 0,
      flows      : r.flows ?? 0,
    };
  });
}

async function fetchTlsSecurity(interval = 1440, limit = 15, agentUuid = null, siteUuid = null) {
  const [dlData, ulData] = await Promise.all([
    netifyFetch('/data/stats/top/tls_security/download', { filter_interval: interval, settings_limit: limit }, agentUuid, siteUuid),
    netifyFetch('/data/stats/top/tls_security/upload', { filter_interval: interval, settings_limit: limit }, agentUuid, siteUuid),
  ]);
  if (!dlData) return [];
  const ulMap = {};
  if (ulData) {
    for (const r of ulData) {
      const key = r.tls_security?.label ?? r.tls_security?.code ?? r.tls_security;
      if (key) ulMap[key] = r.upload ?? 0;
    }
  }
  return dlData.map(r => {
    const label = r.tls_security?.label ?? r.tls_security?.code ?? String(r.tls_security ?? 'Unknown');
    return {
      tls_security : label,
      download     : r.download ?? 0,
      upload       : ulMap[label] ?? 0,
      flows        : r.flows ?? 0,
    };
  });
}

async function fetchTopCountries(interval = 1440, limit = 100, agentUuid = null, siteUuid = null) {
  const [dlData, ulData] = await Promise.all([
    netifyFetch('/data/stats/top/country/download', { filter_interval: interval, settings_limit: limit }, agentUuid, siteUuid),
    netifyFetch('/data/stats/top/country/upload', { filter_interval: interval, settings_limit: limit }, agentUuid, siteUuid),
  ]);
  if (!dlData) return [];
  const ulMap = {};
  if (ulData) {
    for (const r of ulData) {
      const cc = r.country?.code;
      if (cc) ulMap[cc] = r.upload ?? 0;
    }
  }
  return dlData.map(r => {
    return {
      country_code: r.country?.code ?? 'Unknown',
      country_name: r.country?.label ?? '',
      download:     r.download ?? 0,
      upload:       ulMap[r.country?.code] ?? 0,
      flows:        r.flows ?? 0,
    };
  }).filter(r => r.country_code);
}

async function fetchTopProperty(fieldName, interval, limit, agentUuid, siteUuid) {
  const [dlData, ulData] = await Promise.all([
    netifyFetch(`/data/stats/top/${fieldName}/download`, { filter_interval: interval, settings_limit: limit }, agentUuid, siteUuid),
    netifyFetch(`/data/stats/top/${fieldName}/upload`,   { filter_interval: interval, settings_limit: limit }, agentUuid, siteUuid),
  ]);
  if (!dlData) return [];
  const ulMap = {};
  if (ulData) {
    for (const r of ulData) {
      const item = r[fieldName];
      const key = item?.hash ?? item?.name ?? item?.label ?? String(item ?? '');
      if (key) ulMap[key] = r.upload ?? 0;
    }
  }
  return dlData.map(r => {
    const item = r[fieldName];
    const key = item?.hash ?? item?.name ?? item?.label ?? String(item || 'Unknown');
    const label = item?.label ?? key;
    return {
      key,
      label,
      download: r.download ?? 0,
      upload:   ulMap[key] ?? ulMap[label] ?? 0,
      flows:    r.flows ?? 0,
    };
  });
}

function mapProp(data, keyName) {
  return data.map(d => ({
    [keyName]: d.key,
    download: d.download,
    upload:   d.upload,
    flows:    d.flows,
  }));
}

async function fetchDhcpFingerprints(interval = 1440, limit = 50, agentUuid = null, siteUuid = null) {
  return mapProp(await fetchTopProperty('dhcp_class', interval, limit, agentUuid, siteUuid), 'fingerprint');
}

async function fetchHttpUserAgents(interval = 1440, limit = 50, agentUuid = null, siteUuid = null) {
  return mapProp(await fetchTopProperty('http_useragent', interval, limit, agentUuid, siteUuid), 'user_agent');
}

async function fetchBittorrentHashes(interval = 1440, limit = 50, agentUuid = null, siteUuid = null) {
  const data = await fetchTopProperty('bittorrent_info_hash', interval, limit, agentUuid, siteUuid);
  return data.map(d => ({
    info_hash: d.key,
    label:     d.label,
    download:  d.download,
    upload:    d.upload,
    flows:     d.flows,
  }));
}

async function fetchSniHostnames(interval = 1440, limit = 50, agentUuid = null, siteUuid = null) {
  return mapProp(await fetchTopProperty('tls_sni', interval, limit, agentUuid, siteUuid), 'sni_hostname');
}

async function fetchSslServerCn(interval = 1440, limit = 50, agentUuid = null, siteUuid = null) {
  return mapProp(await fetchTopProperty('ssl_server_cn', interval, limit, agentUuid, siteUuid), 'ssl_server_cn');
}

async function fetchQuicHostnames(interval = 1440, limit = 50, agentUuid = null, siteUuid = null) {
  return mapProp(await fetchTopProperty('quic_hostname', interval, limit, agentUuid, siteUuid), 'quic_hostname');
}

async function fetchSshClients(interval = 1440, limit = 50, agentUuid = null, siteUuid = null) {
  return mapProp(await fetchTopProperty('ssh_client', interval, limit, agentUuid, siteUuid), 'ssh_client');
}

async function fetchSshServers(interval = 1440, limit = 50, agentUuid = null, siteUuid = null) {
  return mapProp(await fetchTopProperty('ssh_server', interval, limit, agentUuid, siteUuid), 'ssh_server');
}

async function fetchMdnsHostnames(interval = 1440, limit = 50, agentUuid = null, siteUuid = null) {
  return mapProp(await fetchTopProperty('mdns_hostname', interval, limit, agentUuid, siteUuid), 'mdns_hostname');
}

async function fetchTopProtocols(interval = 1440, limit = 50, agentUuid = null, siteUuid = null) {
  return mapProp(await fetchTopProperty('ip_protocol', interval, limit, agentUuid, siteUuid), 'protocol_label');
}

async function fetchSslSubjectAltNames(interval = 1440, limit = 50, agentUuid = null, siteUuid = null) {
  return mapProp(await fetchTopProperty('ssl_subject_alt_name', interval, limit, agentUuid, siteUuid), 'alt_name');
}

module.exports = {
  fetchTopAppCategories,
  fetchTlsVersions,
  fetchTlsCiphers,
  fetchTlsSecurity,
  fetchTopCountries,
  fetchDhcpFingerprints,
  fetchHttpUserAgents,
  fetchBittorrentHashes,
  fetchSniHostnames,
  fetchSslServerCn,
  fetchQuicHostnames,
  fetchSshClients,
  fetchSshServers,
  fetchMdnsHostnames,
  fetchTopProtocols,
  fetchSslSubjectAltNames,
};
