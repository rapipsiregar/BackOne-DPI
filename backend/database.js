// backend/database.js
const Database = require('better-sqlite3');
const path     = require('path');

const DB_PATH = path.join(__dirname, 'netify_data.db');
let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    initSchema();
  }
  return db;
}

function initSchema() {
  const d = getDB();

  d.exec(`CREATE TABLE IF NOT EXISTS tls_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    tls_version TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS tls_ciphers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    tls_cipher TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS tls_security (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    tls_security TEXT,
    color TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS netbios_hostnames (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    hostname TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  // ─── DPI Fields 12-21 ──────────────────────────────────────────────────────

  d.exec(`CREATE TABLE IF NOT EXISTS dhcp_fingerprints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    fingerprint TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS http_user_agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    user_agent TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS sni_hostnames (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    sni_hostname TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS ssl_server_cn (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    ssl_server_cn TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS quic_hostnames (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    quic_hostname TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS bittorrent_hashes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    info_hash TEXT,
    label TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS ssh_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    ssh_version TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS mdns_hostnames (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    mdns_hostname TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  // ─── Intelligence API 22-30 ────────────────────────────────────────────────

  d.exec(`CREATE TABLE IF NOT EXISTS intel_crypto_mining (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    detected_at TEXT,
    ip_address TEXT, mac_address TEXT,
    pool_host TEXT, pool_ip TEXT,
    protocol TEXT, app_label TEXT,
    confidence REAL,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS intel_device_discovery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    detected_at TEXT,
    ip_address TEXT, mac_address TEXT,
    device_label TEXT, device_type TEXT,
    os_label TEXT, manufacturer TEXT,
    is_new INTEGER DEFAULT 1
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS intel_encryption_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    detected_at TEXT,
    ip_address TEXT, mac_address TEXT,
    device_label TEXT,
    encrypted_pct REAL,
    unencrypted INTEGER DEFAULT 0,
    encrypted INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0,
    risk_level TEXT
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS intel_insecure_protocols (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    detected_at TEXT,
    protocol TEXT,
    ip_address TEXT, mac_address TEXT,
    dst_ip TEXT, dst_port INTEGER,
    app_label TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    risk TEXT,
    source TEXT DEFAULT 'api'
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS intel_ip_reputation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    detected_at TEXT,
    ip_address TEXT, local_ip TEXT,
    mac_address TEXT, reputation TEXT,
    score REAL, country TEXT,
    app_label TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    blacklisted INTEGER DEFAULT 1
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS intel_server_discovery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    detected_at TEXT,
    ip_address TEXT, mac_address TEXT,
    server_type TEXT, hostname TEXT,
    port INTEGER, protocol TEXT,
    os_label TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS intel_tor_detection (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    detected_at TEXT,
    ip_address TEXT, mac_address TEXT,
    exit_node TEXT, circuit_id TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    country TEXT
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS intel_unencrypted_passwords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    detected_at TEXT,
    ip_address TEXT, mac_address TEXT,
    dst_ip TEXT, dst_port INTEGER,
    protocol TEXT, username TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    severity TEXT DEFAULT 'Critical'
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS intel_vpn_detection (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    detected_at TEXT,
    ip_address TEXT, mac_address TEXT,
    vpn_type TEXT, remote_ip TEXT,
    protocol TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    country TEXT, confidence REAL
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS discovery_os (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    os_label TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  // Tabel baru fitur 1-11
  d.exec(`CREATE TABLE IF NOT EXISTS app_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    category_label TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS continents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    continent_name TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS regions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    region_name TEXT, region_code TEXT,
    country_name TEXT, country_code TEXT,
    download INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS cities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    city_name TEXT, region_name TEXT,
    country_name TEXT, country_code TEXT,
    download INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS vlans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    vlan_id INTEGER, vlan_label TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS interfaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    iface_id INTEGER, iface_name TEXT,
    iface_role TEXT, agent_id TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS flow_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    flow_type_label TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS flow_origins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    flow_origin_label TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS ip_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    ip_version_label TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS remote_ips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    remote_ip TEXT, ip_version INTEGER,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS mac_bandwidth (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    mac_address TEXT, manufacturer TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS bandwidth_apps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    app_id INTEGER, app_label TEXT, app_tag TEXT, category TEXT,
    favicon TEXT, download INTEGER DEFAULT 0, upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0, flow_count INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    mac_address TEXT, ip_address TEXT, device_label TEXT,
    device_type TEXT, os_label TEXT, manufacturer TEXT,
    download INTEGER DEFAULT 0, upload INTEGER DEFAULT 0, last_seen TEXT
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS flows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    flow_id TEXT, src_ip TEXT, src_mac TEXT,
    dst_ip TEXT, dst_port INTEGER, protocol TEXT,
    app_label TEXT, domain TEXT,
    bytes_download INTEGER DEFAULT 0, bytes_upload INTEGER DEFAULT 0,
    first_seen TEXT, last_seen TEXT
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS threats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    threat_id TEXT, threat_type TEXT, severity TEXT,
    mac_address TEXT, ip_address TEXT, dst_ip TEXT,
    app_label TEXT, domain TEXT, description TEXT, detected_at TEXT
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS bandwidth_protocols (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    protocol_id INTEGER, protocol_label TEXT,
    download INTEGER DEFAULT 0, upload INTEGER DEFAULT 0,
    flow_count INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS bandwidth_countries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    country_code TEXT, country_name TEXT,
    download INTEGER DEFAULT 0, upload INTEGER DEFAULT 0,
    flow_count INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS dns_queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    domain TEXT, query_count INTEGER DEFAULT 0,
    app_label TEXT, category TEXT
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    event_id TEXT, event_type TEXT, severity TEXT,
    mac_address TEXT, ip_address TEXT,
    description TEXT, event_at TEXT
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS bandwidth_timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fetched_at TEXT NOT NULL,
    total_download INTEGER DEFAULT 0, total_upload INTEGER DEFAULT 0,
    total_flows INTEGER DEFAULT 0, active_devices INTEGER DEFAULT 0
  )`);

  console.log('[DB] Schema siap.');
}

// ─── INSERT FUNCTIONS ─────────────────────────────────────────────────────────

function insertBandwidthApps(rows, fetchedAt) {
  const d    = getDB();
  const stmt = d.prepare(`
    INSERT INTO bandwidth_apps
      (fetched_at, app_id, app_label, app_tag, category, favicon, download, upload, total, flow_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  d.transaction((items) => {
    for (const r of items) {
      stmt.run(
        fetchedAt,
        r.app_id    ?? null,
        r.app_label ?? 'Unknown',
        r.app_tag   ?? null,
        r.category  ?? null,
        r.favicon   ?? null,
        r.download  ?? 0,
        r.upload    ?? 0,
        r.total     ?? (r.download ?? 0) + (r.upload ?? 0),
        r.flows     ?? 0
      );
    }
  })(rows);
}

function insertDevices(rows, fetchedAt) {
  const d    = getDB();
  const stmt = d.prepare(`
    INSERT INTO devices
      (fetched_at, mac_address, ip_address, device_label, device_type, os_label, manufacturer, download, upload, last_seen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  d.transaction((items) => {
    for (const r of items) {
      stmt.run(
        fetchedAt,
        r.mac_address  ?? null,
        r.ip_address   ?? null,
        r.device_label ?? r.ip_address ?? 'Unknown',
        r.device_type  ?? null,
        r.os_label     ?? null,
        r.manufacturer ?? null,
        r.download     ?? 0,
        r.upload       ?? 0,
        r.last_seen    ?? fetchedAt
      );
    }
  })(rows);
}

function insertFlows(rows, fetchedAt) {
  const d    = getDB();
  const stmt = d.prepare(`
    INSERT INTO flows
      (fetched_at, flow_id, src_ip, src_mac, dst_ip, dst_port, protocol, app_label, domain, bytes_download, bytes_upload, first_seen, last_seen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  d.transaction((items) => {
    for (const r of items) {
      stmt.run(
        fetchedAt,
        r.flow_id   ?? null,
        r.src_ip    ?? null,
        r.src_mac   ?? null,
        r.dst_ip    ?? null,
        r.dst_port  ?? null,
        r.protocol  ?? null,
        r.app_label ?? null,
        r.domain    ?? null,
        r.download  ?? 0,
        r.upload    ?? 0,
        r.first_seen ?? fetchedAt,
        r.last_seen  ?? fetchedAt
      );
    }
  })(rows);
}

function insertThreats(rows, fetchedAt) {
  const d    = getDB();
  const stmt = d.prepare(`
    INSERT INTO threats
      (fetched_at, threat_id, threat_type, severity, mac_address, ip_address, dst_ip, app_label, domain, description, detected_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  d.transaction((items) => {
    for (const r of items) {
      stmt.run(
        fetchedAt,
        r.threat_id   ?? null,
        r.threat_type ?? null,
        r.severity    ?? null,
        r.mac_address ?? null,
        r.ip_address  ?? null,
        r.dst_ip      ?? null,
        r.app_label   ?? null,
        r.domain      ?? null,
        r.description ?? null,
        r.detected_at ?? fetchedAt
      );
    }
  })(rows);
}

function insertProtocols(rows, fetchedAt) {
  const d    = getDB();
  const stmt = d.prepare(`
    INSERT INTO bandwidth_protocols
      (fetched_at, protocol_id, protocol_label, download, upload, flow_count)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  d.transaction((items) => {
    for (const r of items) {
      // Data sudah di-flatten oleh netify.js — akses langsung tanpa nested
      stmt.run(
        fetchedAt,
        r.protocol_id    ?? null,
        r.protocol_label ?? 'Unknown',
        r.download       ?? 0,
        r.upload         ?? 0,
        r.flows          ?? 0
      );
    }
  })(rows);
}

function insertCountries(rows, fetchedAt) {
  const d    = getDB();
  const stmt = d.prepare(`
    INSERT INTO bandwidth_countries
      (fetched_at, country_code, country_name, download, upload, flow_count)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  d.transaction((items) => {
    for (const r of items) {
      // Data sudah di-flatten oleh netify.js — akses langsung tanpa nested
      stmt.run(
        fetchedAt,
        r.country_code ?? null,
        r.country_name ?? 'Unknown',
        r.download     ?? 0,
        r.upload       ?? 0,
        r.flows        ?? 0
      );
    }
  })(rows);
}

function insertDNS(rows, fetchedAt) {
  const d    = getDB();
  const stmt = d.prepare(`
    INSERT INTO dns_queries (fetched_at, domain, query_count, app_label, category)
    VALUES (?, ?, ?, ?, ?)
  `);
  d.transaction((items) => {
    for (const r of items) {
      stmt.run(
        fetchedAt,
        r.domain      ?? null,
        r.query_count ?? 0,
        r.app_label   ?? null,
        r.category    ?? null
      );
    }
  })(rows);
}

function insertEvents(rows, fetchedAt) {
  const d    = getDB();
  const stmt = d.prepare(`
    INSERT INTO events
      (fetched_at, event_id, event_type, severity, mac_address, ip_address, description, event_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  d.transaction((items) => {
    for (const r of items) {
      stmt.run(
        fetchedAt,
        r.event_id    ?? null,
        r.event_type  ?? null,
        r.severity    ?? null,
        r.mac_address ?? null,
        r.ip_address  ?? null,
        r.description ?? null,
        r.event_at    ?? fetchedAt
      );
    }
  })(rows);
}

function insertBandwidthTimeline(summary, fetchedAt) {
  const d = getDB();
  d.prepare(`
    INSERT INTO bandwidth_timeline (fetched_at, total_download, total_upload, total_flows, active_devices)
    VALUES (?, ?, ?, ?, ?)
  `).run(fetchedAt, summary.download ?? 0, summary.upload ?? 0, summary.flows ?? 0, summary.devices ?? 0);
}

// ─── QUERY FUNCTIONS ──────────────────────────────────────────────────────────

function getLatestBandwidthApps(limit = 20) {
  const d      = getDB();
  const latest = d.prepare(`SELECT MAX(fetched_at) as t FROM bandwidth_apps`).get();
  if (!latest?.t) return [];
  return d.prepare(`
    SELECT * FROM bandwidth_apps WHERE fetched_at = ? ORDER BY download DESC LIMIT ?
  `).all(latest.t, limit);
}

function getLatestDevices(limit = 100) {
  const d      = getDB();
  const latest = d.prepare(`SELECT MAX(fetched_at) as t FROM devices`).get();
  if (!latest?.t) return [];
  return d.prepare(`
    SELECT * FROM devices WHERE fetched_at = ? ORDER BY download DESC LIMIT ?
  `).all(latest.t, limit);
}

function getLatestFlows(limit = 100) {
  const d      = getDB();
  const latest = d.prepare(`SELECT MAX(fetched_at) as t FROM flows`).get();
  if (!latest?.t) return [];
  return d.prepare(`
    SELECT * FROM flows WHERE fetched_at = ? ORDER BY bytes_download DESC LIMIT ?
  `).all(latest.t, limit);
}

function getLatestThreats(limit = 50) {
  const d = getDB();
  return d.prepare(`SELECT * FROM threats ORDER BY fetched_at DESC LIMIT ?`).all(limit);
}

function getLatestProtocols() {
  const d      = getDB();
  const latest = d.prepare(`SELECT MAX(fetched_at) as t FROM bandwidth_protocols`).get();
  if (!latest?.t) return [];
  return d.prepare(`
    SELECT * FROM bandwidth_protocols WHERE fetched_at = ? ORDER BY download DESC LIMIT 10
  `).all(latest.t);
}

function getLatestCountries() {
  const d      = getDB();
  const latest = d.prepare(`SELECT MAX(fetched_at) as t FROM bandwidth_countries`).get();
  if (!latest?.t) return [];
  return d.prepare(`
    SELECT * FROM bandwidth_countries WHERE fetched_at = ? ORDER BY download DESC LIMIT 15
  `).all(latest.t);
}

function getLatestDNS(limit = 20) {
  const d      = getDB();
  const latest = d.prepare(`SELECT MAX(fetched_at) as t FROM dns_queries`).get();
  if (!latest?.t) return [];
  return d.prepare(`
    SELECT * FROM dns_queries WHERE fetched_at = ? ORDER BY query_count DESC LIMIT ?
  `).all(latest.t, limit);
}

function getLatestEvents(limit = 50) {
  const d = getDB();
  return d.prepare(`SELECT * FROM events ORDER BY fetched_at DESC LIMIT ?`).all(limit);
}

function getBandwidthTimeline(points = 60) {
  const d = getDB();
  return d.prepare(`
    SELECT * FROM bandwidth_timeline ORDER BY fetched_at DESC LIMIT ?
  `).all(points).reverse();
}

function getStats() {
  const d = getDB();

  // Hitung devices aktif dari polling terakhir (bukan DISTINCT mac karena null)
  const latestDevFetch = d.prepare(`SELECT MAX(fetched_at) as t FROM devices`).get();
  const totalDevices   = latestDevFetch?.t
    ? (d.prepare(`SELECT COUNT(*) as n FROM devices WHERE fetched_at = ?`).get(latestDevFetch.t)?.n ?? 0)
    : 0;

  // Hitung flows aktif dari polling terakhir
  const latestFlowFetch = d.prepare(`SELECT MAX(fetched_at) as t FROM flows`).get();
  const activeFlows     = latestFlowFetch?.t
    ? (d.prepare(`SELECT COUNT(*) as n FROM flows WHERE fetched_at = ?`).get(latestFlowFetch.t)?.n ?? 0)
    : 0;

  const totalThreats = d.prepare(`SELECT COUNT(*) as n FROM threats`).get()?.n ?? 0;
  const totalEvents  = d.prepare(`SELECT COUNT(*) as n FROM events`).get()?.n  ?? 0;
  const lastFetch    = d.prepare(`SELECT MAX(fetched_at) as t FROM bandwidth_timeline`).get()?.t ?? null;
  const latestBw     = d.prepare(`SELECT * FROM bandwidth_timeline ORDER BY fetched_at DESC LIMIT 1`).get();

  return { totalDevices, activeFlows, totalThreats, totalEvents, lastFetch, latestBw };
}

// ─── INSERT FITUR BARU 1-11 ───────────────────────────────────────────────────
function insertAppCategories(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO app_categories (fetched_at, category_label, download, upload, total) VALUES (?,?,?,?,?)`);
  d.transaction(items => { for (const r of items) stmt.run(fetchedAt, r.category_label, r.download, r.upload, r.total); })(rows);
}

function insertContinents(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO continents (fetched_at, continent_name, download, upload, total) VALUES (?,?,?,?,?)`);
  d.transaction(items => { for (const r of items) stmt.run(fetchedAt, r.continent_name, r.download, r.upload, r.total); })(rows);
}

function insertRegions(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO regions (fetched_at, region_name, region_code, country_name, country_code, download) VALUES (?,?,?,?,?,?)`);
  d.transaction(items => { for (const r of items) stmt.run(fetchedAt, r.region_name, r.region_code, r.country_name, r.country_code, r.download); })(rows);
}

function insertCities(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO cities (fetched_at, city_name, region_name, country_name, country_code, download) VALUES (?,?,?,?,?,?)`);
  d.transaction(items => { for (const r of items) stmt.run(fetchedAt, r.city_name, r.region_name, r.country_name, r.country_code, r.download); })(rows);
}

function insertVLANs(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO vlans (fetched_at, vlan_id, vlan_label, download, upload, total) VALUES (?,?,?,?,?,?)`);
  d.transaction(items => { for (const r of items) stmt.run(fetchedAt, r.vlan_id, r.vlan_label, r.download, r.upload, r.total); })(rows);
}

function insertInterfaces(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO interfaces (fetched_at, iface_id, iface_name, iface_role, agent_id, download, upload, total) VALUES (?,?,?,?,?,?,?,?)`);
  d.transaction(items => { for (const r of items) stmt.run(fetchedAt, r.iface_id, r.iface_name, r.iface_role, String(r.agent_id ?? ''), r.download, r.upload, r.total); })(rows);
}

function insertFlowTypes(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO flow_types (fetched_at, flow_type_label, download, upload, total) VALUES (?,?,?,?,?)`);
  d.transaction(items => { for (const r of items) stmt.run(fetchedAt, r.flow_type_label, r.download, r.upload, r.total); })(rows);
}

function insertFlowOrigins(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO flow_origins (fetched_at, flow_origin_label, download, upload, total) VALUES (?,?,?,?,?)`);
  d.transaction(items => { for (const r of items) stmt.run(fetchedAt, r.flow_origin_label, r.download, r.upload, r.total); })(rows);
}

function insertIPVersions(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO ip_versions (fetched_at, ip_version_label, download, upload, total) VALUES (?,?,?,?,?)`);
  d.transaction(items => { for (const r of items) stmt.run(fetchedAt, r.ip_version_label, r.download, r.upload, r.total); })(rows);
}

function insertRemoteIPs(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO remote_ips (fetched_at, remote_ip, ip_version, download, upload, total) VALUES (?,?,?,?,?,?)`);
  d.transaction(items => { for (const r of items) stmt.run(fetchedAt, r.remote_ip, r.ip_version, r.download, r.upload, r.total); })(rows);
}

function insertMACBandwidth(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO mac_bandwidth (fetched_at, mac_address, manufacturer, download, upload, total) VALUES (?,?,?,?,?,?)`);
  d.transaction(items => { for (const r of items) stmt.run(fetchedAt, r.mac_address, r.manufacturer, r.download, r.upload, r.total); })(rows);
}

// ─── QUERY FITUR BARU ─────────────────────────────────────────────────────────
function getLatest(table, orderBy = 'download', limit = 50) {
  const d = getDB();
  const latest = d.prepare(`SELECT MAX(fetched_at) as t FROM ${table}`).get();
  if (!latest?.t) return [];
  return d.prepare(`SELECT * FROM ${table} WHERE fetched_at = ? ORDER BY ${orderBy} DESC LIMIT ?`).all(latest.t, limit);
}

// DPI Fields
function insertTLSVersions(rows, fetchedAt) {
  const d    = getDB();
  const stmt = d.prepare(`INSERT INTO tls_versions (fetched_at, tls_version, download, upload, total) VALUES (?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(fetchedAt, r.tls_version, r.download, r.upload, r.total);
  })(rows);
}

function insertTLSCiphers(rows, fetchedAt) {
  const d    = getDB();
  const stmt = d.prepare(`INSERT INTO tls_ciphers (fetched_at, tls_cipher, download, upload, total) VALUES (?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(fetchedAt, r.tls_cipher, r.download, r.upload, r.total);
  })(rows);
}

function insertTLSSecurity(rows, fetchedAt) {
  const d    = getDB();
  const stmt = d.prepare(`INSERT INTO tls_security (fetched_at, tls_security, color, download, upload, total) VALUES (?,?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(fetchedAt, r.tls_security, r.color, r.download, r.upload, r.total);
  })(rows);
}

function insertNetBIOSHostnames(rows, fetchedAt) {
  const d    = getDB();
  const stmt = d.prepare(`INSERT INTO netbios_hostnames (fetched_at, hostname, download, upload, total) VALUES (?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(fetchedAt, r.hostname, r.download, r.upload, r.total);
  })(rows);
}

function insertDiscoveryOS(rows, fetchedAt) {
  const d    = getDB();
  const stmt = d.prepare(`INSERT INTO discovery_os (fetched_at, os_label, download, upload, total) VALUES (?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(fetchedAt, r.os_label, r.download, r.upload, r.total);
  })(rows);
}

// ─── INSERT DPI 12-21 ────────────────────────────────────────────────────────

function insertDHCPFingerprints(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO dhcp_fingerprints (fetched_at, fingerprint, download, upload, total) VALUES (?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(fetchedAt, r.fingerprint, r.download, r.upload, r.total);
  })(rows);
}

function insertHTTPUserAgents(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO http_user_agents (fetched_at, user_agent, download, upload, total) VALUES (?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(fetchedAt, r.user_agent, r.download, r.upload, r.total);
  })(rows);
}

function insertSNIHostnames(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO sni_hostnames (fetched_at, sni_hostname, download, upload, total) VALUES (?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(fetchedAt, r.sni_hostname, r.download, r.upload, r.total);
  })(rows);
}

function insertSSLServerCN(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO ssl_server_cn (fetched_at, ssl_server_cn, download, upload, total) VALUES (?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(fetchedAt, r.ssl_server_cn, r.download, r.upload, r.total);
  })(rows);
}

function insertQUICHostnames(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO quic_hostnames (fetched_at, quic_hostname, download, upload, total) VALUES (?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(fetchedAt, r.quic_hostname, r.download, r.upload, r.total);
  })(rows);
}

function insertBitTorrentHashes(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO bittorrent_hashes (fetched_at, info_hash, label, download, upload, total) VALUES (?,?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(fetchedAt, r.info_hash, r.label, r.download, r.upload, r.total);
  })(rows);
}

function insertSSHVersions(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO ssh_versions (fetched_at, ssh_version, download, upload, total) VALUES (?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(fetchedAt, r.ssh_version, r.download, r.upload, r.total);
  })(rows);
}

function insertMDNSHostnames(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO mdns_hostnames (fetched_at, mdns_hostname, download, upload, total) VALUES (?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(fetchedAt, r.mdns_hostname, r.download, r.upload, r.total);
  })(rows);
}

// ─── INSERT INTELLIGENCE 22-30 ────────────────────────────────────────────────

function insertCryptoMining(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO intel_crypto_mining
    (fetched_at, detected_at, ip_address, mac_address, pool_host, pool_ip, protocol, app_label, confidence, download, upload)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
      fetchedAt, r.detected_at ?? fetchedAt, r.ip_address, r.mac_address,
      r.pool_host, r.pool_ip, r.protocol, r.app_label, r.confidence,
      r.download ?? 0, r.upload ?? 0
    );
  })(rows);
}

function insertDeviceDiscovery(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO intel_device_discovery
    (fetched_at, detected_at, ip_address, mac_address, device_label, device_type, os_label, manufacturer, is_new)
    VALUES (?,?,?,?,?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
      fetchedAt, r.detected_at ?? fetchedAt, r.ip_address, r.mac_address,
      r.device_label, r.device_type, r.os_label, r.manufacturer,
      r.is_new ? 1 : 0
    );
  })(rows);
}

function insertEncryptionAudit(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO intel_encryption_audit
    (fetched_at, detected_at, ip_address, mac_address, device_label, encrypted_pct, unencrypted, encrypted, total, risk_level)
    VALUES (?,?,?,?,?,?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
      fetchedAt, r.detected_at ?? fetchedAt, r.ip_address, r.mac_address,
      r.device_label, r.encrypted_pct, r.unencrypted ?? 0, r.encrypted ?? 0,
      r.total ?? 0, r.risk_level
    );
  })(rows);
}

function insertInsecureProtocols(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO intel_insecure_protocols
    (fetched_at, detected_at, protocol, ip_address, mac_address, dst_ip, dst_port, app_label, download, upload, risk, source)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
      fetchedAt, r.detected_at ?? fetchedAt, r.protocol, r.ip_address, r.mac_address,
      r.dst_ip, r.dst_port, r.app_label, r.download ?? 0, r.upload ?? 0,
      r.risk ?? 'Medium', r.source ?? 'api'
    );
  })(rows);
}

function insertIPReputation(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO intel_ip_reputation
    (fetched_at, detected_at, ip_address, local_ip, mac_address, reputation, score, country, app_label, download, upload, blacklisted)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
      fetchedAt, r.detected_at ?? fetchedAt, r.ip_address, r.local_ip, r.mac_address,
      r.reputation, r.score, r.country, r.app_label,
      r.download ?? 0, r.upload ?? 0, r.blacklisted ? 1 : 0
    );
  })(rows);
}

function insertServerDiscovery(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO intel_server_discovery
    (fetched_at, detected_at, ip_address, mac_address, server_type, hostname, port, protocol, os_label, download, upload)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
      fetchedAt, r.detected_at ?? fetchedAt, r.ip_address, r.mac_address,
      r.server_type, r.hostname, r.port, r.protocol, r.os_label,
      r.download ?? 0, r.upload ?? 0
    );
  })(rows);
}

function insertTorDetection(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO intel_tor_detection
    (fetched_at, detected_at, ip_address, mac_address, exit_node, circuit_id, download, upload, country)
    VALUES (?,?,?,?,?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
      fetchedAt, r.detected_at ?? fetchedAt, r.ip_address, r.mac_address,
      r.exit_node, r.circuit_id, r.download ?? 0, r.upload ?? 0, r.country
    );
  })(rows);
}

function insertUnencryptedPasswords(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO intel_unencrypted_passwords
    (fetched_at, detected_at, ip_address, mac_address, dst_ip, dst_port, protocol, username, download, upload, severity)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
      fetchedAt, r.detected_at ?? fetchedAt, r.ip_address, r.mac_address,
      r.dst_ip, r.dst_port, r.protocol, r.username,
      r.download ?? 0, r.upload ?? 0, r.severity ?? 'Critical'
    );
  })(rows);
}

function insertVPNDetection(rows, fetchedAt) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO intel_vpn_detection
    (fetched_at, detected_at, ip_address, mac_address, vpn_type, remote_ip, protocol, download, upload, country, confidence)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
      fetchedAt, r.detected_at ?? fetchedAt, r.ip_address, r.mac_address,
      r.vpn_type, r.remote_ip, r.protocol,
      r.download ?? 0, r.upload ?? 0, r.country, r.confidence
    );
  })(rows);
}

// ─── QUERY Intelligence — ambil semua row tanpa batasan fetched_at ────────────
// (karena event ini tidak diposting ulang tiap menit, simpan kumulatif)
function getIntelData(table, limit = 100) {
  const d = getDB();
  return d.prepare(`SELECT * FROM ${table} ORDER BY fetched_at DESC LIMIT ?`).all(limit);
}

function getIntelStats() {
  const d = getDB();
  const tables = [
    'intel_crypto_mining', 'intel_device_discovery', 'intel_encryption_audit',
    'intel_insecure_protocols', 'intel_ip_reputation', 'intel_server_discovery',
    'intel_tor_detection', 'intel_unencrypted_passwords', 'intel_vpn_detection',
  ];
  const counts = {};
  for (const t of tables) {
    try {
      counts[t] = d.prepare(`SELECT COUNT(*) as n FROM ${t}`).get()?.n ?? 0;
    } catch { counts[t] = 0; }
  }
  return counts;
}

module.exports = {
  getDB,
  insertBandwidthApps, insertDevices, insertFlows, insertThreats,
  insertProtocols, insertCountries, insertDNS, insertEvents,
  insertBandwidthTimeline,
  getLatestBandwidthApps, getLatestDevices, getLatestFlows, getLatestThreats,
  getLatestProtocols, getLatestCountries, getLatestDNS, getLatestEvents,
  getBandwidthTimeline, getStats,
  // Insert baru
  insertAppCategories, insertContinents, insertRegions, insertCities,
  insertVLANs, insertInterfaces, insertFlowTypes, insertFlowOrigins,
  insertIPVersions, insertRemoteIPs, insertMACBandwidth,
  // Query helper
  getLatest,
  insertTLSVersions, insertTLSCiphers, insertTLSSecurity, insertNetBIOSHostnames,
  insertDiscoveryOS,
  // DPI 12-21
  insertDHCPFingerprints, insertHTTPUserAgents, insertSNIHostnames, insertSSLServerCN,
  insertQUICHostnames, insertBitTorrentHashes, insertSSHVersions, insertMDNSHostnames,
  // Intelligence 22-30
  insertCryptoMining, insertDeviceDiscovery, insertEncryptionAudit,
  insertInsecureProtocols, insertIPReputation, insertServerDiscovery,
  insertTorDetection, insertUnencryptedPasswords, insertVPNDetection,
  getIntelData, getIntelStats,
};