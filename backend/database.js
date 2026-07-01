// backend/database.js
const Database = require('better-sqlite3');
const path     = require('path');
const bcrypt   = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'netify_data.db');
let db;

// Agent UUID mappings to MAC addresses and numeric interface IDs
const AGENT_MAC_MAP = {
  '2F-TF-1D-GK': ['60:be:b4:1f:05:96'],
  '8A-V3-PB-85': ['04:f4:1c:ce:c2:e6'],
  'F6-2V-DT-8A': [
    '2c:7b:a0:d8:86:91', '16:11:ac:73:34:1d', 'bc:45:5b:ca:d5:be',
    'de:ed:cc:57:58:34', 'f4:6d:3f:ef:01:a0', '60:be:b4:29:d3:36',
    '70:85:6c:81:50:d4', '70:85:6c:6d:f7:17', '60:be:b4:29:d3:33',
    '60:be:b4:26:4c:d6', '60:be:b4:29:d3:32'
  ],
};

const AGENT_NUMERIC_IDS = {
  '2F-TF-1D-GK': ['4894730147'],
  '8A-V3-PB-85': ['4895530456'],
  'F6-2V-DT-8A': ['4895853843', '4897042839'],
};

function getAgentTrafficRatio(agentUuid) {
  const d = getDB();
  const macs = AGENT_MAC_MAP[agentUuid];
  if (!macs || macs.length === 0) return 0;
  
  const latest = d.prepare("SELECT MAX(fetched_at) as t FROM mac_bandwidth").get();
  if (!latest?.t) return 0;
  
  const siteTotal = d.prepare("SELECT SUM(total) as val FROM mac_bandwidth WHERE fetched_at = ?").get(latest.t)?.val || 1;
  
  const placeholders = macs.map(() => '?').join(',');
  const agentTotal = d.prepare(`SELECT SUM(total) as val FROM mac_bandwidth WHERE fetched_at = ? AND mac_address IN (${placeholders})`).get(latest.t, ...macs)?.val || 0;
  
  return siteTotal > 0 ? (agentTotal / siteTotal) : 0;
}

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

  // ─── AUTHENTICATION ─────────────────────────────────────────────────────────
  d.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'AGENT_VIEWER',
    site_uuid TEXT DEFAULT NULL,
    agent_uuid TEXT DEFAULT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Alter users table to add agent_uuid if it was created on an older schema
  try {
    d.exec("ALTER TABLE users ADD COLUMN agent_uuid TEXT DEFAULT NULL");
  } catch (e) {
    // Column already exists, safe to ignore
  }

  const adminExists = d.prepare("SELECT count(*) as count FROM users WHERE username = 'admin'").get();
  if (adminExists.count === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    d.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)").run('admin', hash, 'SUPER_ADMIN');
    console.log('[DB] Created default admin user (admin / admin123)');
  }
  
  const agentExists = d.prepare("SELECT count(*) as count FROM users WHERE username = 'agent1'").get();
  if (agentExists.count === 0) {
    const hash = bcrypt.hashSync('agent123', 10);
    const site_uuid = process.env.NETIFY_SITE_UUID || '6681452d_9cae_4ff4_8ae8_0d504774265e';
    d.prepare("INSERT INTO users (username, password_hash, role, site_uuid, agent_uuid) VALUES (?, ?, ?, ?, ?)").run('agent1', hash, 'AGENT_VIEWER', site_uuid, '8A-V3-PB-85');
    console.log('[DB] Created default agent user (agent1 / agent123)');
  }

  // Seed specific agent accounts for testing isolation
  const agentJrpExists = d.prepare("SELECT count(*) as count FROM users WHERE username = 'agent_jrp'").get();
  if (agentJrpExists.count === 0) {
    const hash = bcrypt.hashSync('agent123', 10);
    d.prepare("INSERT INTO users (username, password_hash, role, site_uuid, agent_uuid) VALUES (?, ?, ?, ?, ?)").run('agent_jrp', hash, 'AGENT_VIEWER', '6681452d_9cae_4ff4_8ae8_0d504774265e', '2F-TF-1D-GK');
    console.log('[DB] Created JRP Cibubur agent user (agent_jrp / agent123)');
  }

  const agentIfgExists = d.prepare("SELECT count(*) as count FROM users WHERE username = 'agent_ifg'").get();
  if (agentIfgExists.count === 0) {
    const hash = bcrypt.hashSync('agent123', 10);
    d.prepare("INSERT INTO users (username, password_hash, role, site_uuid, agent_uuid) VALUES (?, ?, ?, ?, ?)").run('agent_ifg', hash, 'AGENT_VIEWER', '6681452d_9cae_4ff4_8ae8_0d504774265e', '8A-V3-PB-85');
    console.log('[DB] Created IFG LT.18 agent user (agent_ifg / agent123)');
  }

  const agentCpiExists = d.prepare("SELECT count(*) as count FROM users WHERE username = 'agent_cpi'").get();
  if (agentCpiExists.count === 0) {
    const hash = bcrypt.hashSync('agent123', 10);
    d.prepare("INSERT INTO users (username, password_hash, role, site_uuid, agent_uuid) VALUES (?, ?, ?, ?, ?)").run('agent_cpi', hash, 'AGENT_VIEWER', '6681452d_9cae_4ff4_8ae8_0d504774265e', 'F6-2V-DT-8A');
    console.log('[DB] Created CPI Balaraja agent user (agent_cpi / agent123)');
  }

  d.exec(`CREATE TABLE IF NOT EXISTS tls_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    tls_version TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS tls_ciphers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    tls_cipher TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS tls_security (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    tls_security TEXT,
    color TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS netbios_hostnames (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    hostname TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  // ─── DPI Fields 12-21 ──────────────────────────────────────────────────────

  d.exec(`CREATE TABLE IF NOT EXISTS dhcp_fingerprints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    fingerprint TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS http_user_agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    user_agent TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS sni_hostnames (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    sni_hostname TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS ssl_server_cn (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    ssl_server_cn TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS quic_hostnames (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    quic_hostname TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS bittorrent_hashes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    info_hash TEXT,
    label TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS ssh_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    ssh_version TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS mdns_hostnames (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    mdns_hostname TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  // ─── Intelligence API 22-30 ────────────────────────────────────────────────

  d.exec(`CREATE TABLE IF NOT EXISTS intel_crypto_mining (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
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
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    detected_at TEXT,
    ip_address TEXT, mac_address TEXT,
    device_label TEXT, device_type TEXT,
    os_label TEXT, manufacturer TEXT,
    is_new INTEGER DEFAULT 1
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS intel_encryption_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
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
    site_uuid TEXT,
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
    site_uuid TEXT,
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
    site_uuid TEXT,
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
    site_uuid TEXT,
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
    site_uuid TEXT,
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
    site_uuid TEXT,
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
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    os_label TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  // Tabel baru fitur 1-11
  d.exec(`CREATE TABLE IF NOT EXISTS app_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    category_label TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS continents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    continent_name TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS regions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    region_name TEXT, region_code TEXT,
    country_name TEXT, country_code TEXT,
    download INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS cities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    city_name TEXT, region_name TEXT,
    country_name TEXT, country_code TEXT,
    download INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS vlans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    vlan_id INTEGER, vlan_label TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS interfaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    iface_id INTEGER, iface_name TEXT,
    iface_role TEXT, agent_id TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS flow_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    flow_type_label TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS flow_origins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    flow_origin_label TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS ip_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    ip_version_label TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS remote_ips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    remote_ip TEXT, ip_version INTEGER,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS mac_bandwidth (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    mac_address TEXT, manufacturer TEXT,
    download INTEGER DEFAULT 0,
    upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS bandwidth_apps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    app_id INTEGER, app_label TEXT, app_tag TEXT, category TEXT,
    favicon TEXT, download INTEGER DEFAULT 0, upload INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0, flow_count INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    mac_address TEXT, ip_address TEXT, device_label TEXT,
    device_type TEXT, os_label TEXT, manufacturer TEXT,
    download INTEGER DEFAULT 0, upload INTEGER DEFAULT 0, last_seen TEXT
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS flows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    flow_id TEXT, src_ip TEXT, src_mac TEXT,
    dst_ip TEXT, dst_port INTEGER, protocol TEXT,
    app_label TEXT, domain TEXT,
    bytes_download INTEGER DEFAULT 0, bytes_upload INTEGER DEFAULT 0,
    first_seen TEXT, last_seen TEXT
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS threats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    threat_id TEXT, threat_type TEXT, severity TEXT,
    mac_address TEXT, ip_address TEXT, dst_ip TEXT,
    app_label TEXT, domain TEXT, description TEXT, detected_at TEXT
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS bandwidth_protocols (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    protocol_id INTEGER, protocol_label TEXT,
    download INTEGER DEFAULT 0, upload INTEGER DEFAULT 0,
    flow_count INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS bandwidth_countries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    country_code TEXT, country_name TEXT,
    download INTEGER DEFAULT 0, upload INTEGER DEFAULT 0,
    flow_count INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS dns_queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    domain TEXT, query_count INTEGER DEFAULT 0,
    app_label TEXT, category TEXT
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    event_id TEXT, event_type TEXT, severity TEXT,
    mac_address TEXT, ip_address TEXT,
    description TEXT, event_at TEXT
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS bandwidth_timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_uuid TEXT,
    fetched_at TEXT NOT NULL,
    total_download INTEGER DEFAULT 0, total_upload INTEGER DEFAULT 0,
    total_flows INTEGER DEFAULT 0, active_devices INTEGER DEFAULT 0
  )`);

  d.exec(`CREATE TABLE IF NOT EXISTS geoip_cache (
    ip_address TEXT PRIMARY KEY,
    isp TEXT,
    country TEXT,
    city TEXT,
    as_org TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  console.log('[DB] Schema siap.');
}

// ─── INSERT FUNCTIONS ─────────────────────────────────────────────────────────

function insertBandwidthApps(rows, fetchedAt, siteUuid) {
  const d    = getDB();
  const stmt = d.prepare(`
    INSERT INTO bandwidth_apps
    (site_uuid, fetched_at, app_id, app_label, app_tag, category, favicon, download, upload, total, flow_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  d.transaction((items) => {
    for (const r of items) {
      stmt.run(
    siteUuid, fetchedAt,
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

function insertDevices(rows, fetchedAt, siteUuid) {
  const d    = getDB();
  const stmt = d.prepare(`
    INSERT INTO devices
    (site_uuid, fetched_at, mac_address, ip_address, device_label, device_type, os_label, manufacturer, download, upload, last_seen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  d.transaction((items) => {
    for (const r of items) {
      stmt.run(
    siteUuid, fetchedAt,
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

function insertFlows(rows, fetchedAt, siteUuid) {
  const d    = getDB();
  const stmt = d.prepare(`
    INSERT INTO flows
    (site_uuid, fetched_at, flow_id, src_ip, src_mac, dst_ip, dst_port, protocol, app_label, domain, bytes_download, bytes_upload, first_seen, last_seen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  d.transaction((items) => {
    for (const r of items) {
      stmt.run(
    siteUuid, fetchedAt,
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

function insertThreats(rows, fetchedAt, siteUuid) {
  const d    = getDB();
  const stmt = d.prepare(`
    INSERT INTO threats
    (site_uuid, fetched_at, threat_id, threat_type, severity, mac_address, ip_address, dst_ip, app_label, domain, description, detected_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  d.transaction((items) => {
    for (const r of items) {
      stmt.run(
    siteUuid, fetchedAt,
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

function insertProtocols(rows, fetchedAt, siteUuid) {
  const d    = getDB();
  const stmt = d.prepare(`
    INSERT INTO bandwidth_protocols
    (site_uuid, fetched_at, protocol_id, protocol_label, download, upload, flow_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  d.transaction((items) => {
    for (const r of items) {
      // Data sudah di-flatten oleh netify.js — akses langsung tanpa nested
      stmt.run(
    siteUuid, fetchedAt,
        r.protocol_id    ?? null,
        r.protocol_label ?? 'Unknown',
        r.download       ?? 0,
        r.upload         ?? 0,
        r.flows          ?? 0
      );
    }
  })(rows);
}

function insertCountries(rows, fetchedAt, siteUuid) {
  const d    = getDB();
  const stmt = d.prepare(`
    INSERT INTO bandwidth_countries
    (site_uuid, fetched_at, country_code, country_name, download, upload, flow_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  d.transaction((items) => {
    for (const r of items) {
      // Data sudah di-flatten oleh netify.js — akses langsung tanpa nested
      stmt.run(
    siteUuid, fetchedAt,
        r.country_code ?? null,
        r.country_name ?? 'Unknown',
        r.download     ?? 0,
        r.upload       ?? 0,
        r.flows        ?? 0
      );
    }
  })(rows);
}

function insertDNS(rows, fetchedAt, siteUuid) {
  const d    = getDB();
  const stmt = d.prepare(`
    INSERT INTO dns_queries
    (site_uuid, fetched_at, domain, query_count, app_label, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  d.transaction((items) => {
    for (const r of items) {
      stmt.run(
    siteUuid, fetchedAt,
        r.domain      ?? null,
        r.query_count ?? 0,
        r.app_label   ?? null,
        r.category    ?? null
      );
    }
  })(rows);
}

function insertEvents(rows, fetchedAt, siteUuid) {
  const d    = getDB();
  const stmt = d.prepare(`
    INSERT INTO events
    (site_uuid, fetched_at, event_id, event_type, severity, mac_address, ip_address, description, event_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  d.transaction((items) => {
    for (const r of items) {
      stmt.run(
    siteUuid, fetchedAt,
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

function insertBandwidthTimeline(summary, fetchedAt, siteUuid) {
  const d = getDB();
  d.prepare(`
    INSERT INTO bandwidth_timeline
    (site_uuid, fetched_at, total_download, total_upload, total_flows, active_devices)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    siteUuid, fetchedAt, summary.download ?? 0, summary.upload ?? 0, summary.flows ?? 0, summary.devices ?? 0);
}

// ─── QUERY FUNCTIONS ──────────────────────────────────────────────────────────

function getLatestBandwidthApps(limit = 20, siteUuid = null, agentUuid = null) {
  const d      = getDB();
  const latest = d.prepare(`SELECT MAX(fetched_at) as t FROM flows`).get();
  if (!latest?.t) return [];

  if (agentUuid && AGENT_MAC_MAP[agentUuid]) {
    const macs = AGENT_MAC_MAP[agentUuid];
    const placeholders = macs.map(() => '?').join(',');
    return d.prepare(`
      SELECT app_label, SUM(bytes_download) AS download, SUM(bytes_upload) AS upload,
             (SUM(bytes_download) + SUM(bytes_upload)) AS total, COUNT(*) AS flow_count
      FROM flows
      WHERE src_mac IN (${placeholders}) AND fetched_at = ? AND app_label IS NOT NULL
      GROUP BY app_label
      ORDER BY download DESC
      LIMIT ?
    `).all(...macs, latest.t, limit);
  }

  const appsLatest = d.prepare(`SELECT MAX(fetched_at) as t FROM bandwidth_apps`).get();
  if (!appsLatest?.t) return [];
  return d.prepare(`
    SELECT * FROM bandwidth_apps WHERE (@siteUuid IS NULL OR site_uuid = @siteUuid) AND  fetched_at = @fetched_at ORDER BY download DESC LIMIT @limit
  `).all({ fetched_at: appsLatest.t, limit, siteUuid });
}

function resolveDeviceMetadata(ip, mac, dbLabel, dbManufacturer, dbType) {
  let label = dbLabel || ip;
  let manufacturer = dbManufacturer || 'Unknown';
  let type = dbType || 'Generic Client';
  let os = 'Unknown';

  if (manufacturer.includes('Routerboard') || manufacturer.includes('MikroTik')) {
    manufacturer = 'MikroTik';
    type = 'Router/Network';
    os = 'RouterOS';
  } else if (manufacturer.includes('Fortinet')) {
    manufacturer = 'Fortinet';
    type = 'Firewall/Network';
    os = 'FortiOS';
  } else if (manufacturer.includes('WatchGuard')) {
    manufacturer = 'WatchGuard';
    type = 'Firewall/Network';
    os = 'Fireware';
  } else if (manufacturer.includes('Juniper')) {
    manufacturer = 'Juniper';
    type = 'Switch/Network';
    os = 'Junos';
  } else if (manufacturer.includes('Apple')) {
    manufacturer = 'Apple';
    type = 'Smart Device';
    os = 'iOS/macOS';
  } else if (manufacturer.includes('Samsung')) {
    manufacturer = 'Samsung';
    type = 'Smart TV';
    os = 'Tizen OS';
  } else if (manufacturer.includes('LCFC') || manufacturer.includes('Lenovo')) {
    manufacturer = 'Lenovo';
    type = 'Workstation';
    os = 'Windows/Linux';
  } else if (manufacturer.includes('Huawei')) {
    manufacturer = 'Huawei';
    type = 'Mobile';
    os = 'Android';
  } else if (manufacturer.includes('Dahua')) {
    manufacturer = 'Dahua';
    type = 'IP Camera';
    os = 'Embedded OS';
  }

  const labelLower = label.toLowerCase();
  if (labelLower.includes('windows') || labelLower.includes('microsoft')) {
    os = 'Windows';
    type = 'Workstation';
    manufacturer = manufacturer === 'Unknown' ? 'Microsoft' : manufacturer;
  } else if (labelLower.includes('apple') || labelLower.includes('iphone') || labelLower.includes('ipad') || labelLower.includes('mac')) {
    os = labelLower.includes('mac') ? 'macOS' : 'Apple iOS';
    type = labelLower.includes('mac') ? 'Workstation' : 'Mobile';
    manufacturer = 'Apple';
  } else if (labelLower.includes('android') || labelLower.includes('oppo') || labelLower.includes('samsung phone')) {
    os = 'Android';
    type = 'Mobile';
    if (labelLower.includes('oppo')) manufacturer = 'Oppo';
    if (labelLower.includes('samsung')) manufacturer = 'Samsung';
  } else if (labelLower.includes('samsung tv') || labelLower.includes('tizen')) {
    os = 'Tizen OS';
    type = 'Smart TV';
    manufacturer = 'Samsung';
  } else if (labelLower.includes('agent device')) {
    os = 'Linux';
    type = 'Security Agent';
    manufacturer = 'S-Bluetech';
  }

  const isRouterIP = ['10.6.50.25', '10.6.12.242', '192.168.9.1', '10.6.11.208', '10.6.10.4'].includes(ip);
  if (type === 'Router/Network' && !isRouterIP) {
    type = 'LAN Client';
    manufacturer = 'Unknown';
    os = 'Windows/Linux';
  }

  return { label, manufacturer, type, os };
}

function getLatestDevices(limit = 100, siteUuid = null, agentUuid = null) {
  const d      = getDB();
  const latest = d.prepare(`SELECT MAX(fetched_at) as t FROM devices`).get();
  if (!latest?.t) return [];

  // Load intelligence tables to assist in type resolving
  const intelList = d.prepare("SELECT * FROM intel_device_discovery").all();
  const intelMap = new Map(intelList.map(i => [i.ip_address, i]));

  // Get all devices in latest snapshot from devices table
  const devices = d.prepare(`SELECT * FROM devices WHERE fetched_at = ?`).all(latest.t);

  // Get active flow bandwidth in latest flows snapshot
  const latestFlowFetch = d.prepare(`SELECT MAX(fetched_at) as t FROM flows`).get();
  let flowsBandwidth = [];
  if (latestFlowFetch?.t) {
    flowsBandwidth = d.prepare(`
      SELECT src_ip, src_mac, SUM(bytes_download) as flow_download, SUM(bytes_upload) as flow_upload
      FROM flows
      WHERE fetched_at = ?
      GROUP BY src_ip
    `).all(latestFlowFetch.t);
  }
  const flowMap = new Map(flowsBandwidth.map(f => [f.src_ip, f]));

  const resolved = [];
  const seenIps = new Set();

  function processDevice(ip, mac, dbDev, flowInfo) {
    const intelInfo = intelMap.get(ip);
    const dbLabel = dbDev ? dbDev.device_label : (intelInfo ? intelInfo.device_label : null);
    const dbMan = dbDev ? dbDev.manufacturer : (intelInfo ? intelInfo.manufacturer : null);
    const dbType = intelInfo ? intelInfo.device_type : null;

    const meta = resolveDeviceMetadata(ip, mac, dbLabel, dbMan, dbType);
    const isRouted = mac === '04:f4:1c:ce:c2:e6' && ip !== '10.6.50.25' && ip !== '10.6.12.242';

    const download = flowInfo ? flowInfo.flow_download : (dbDev ? dbDev.download : 0);
    const upload = flowInfo ? flowInfo.flow_upload : (dbDev ? dbDev.upload : 0);

    return {
      id: dbDev ? dbDev.id : null,
      site_uuid: dbDev ? dbDev.site_uuid : siteUuid,
      fetched_at: latest.t,
      mac_address: mac,
      ip_address: ip,
      device_label: meta.label,
      device_type: meta.type,
      os_label: meta.os,
      manufacturer: meta.manufacturer,
      download: download || 0,
      upload: upload || 0,
      total: (download || 0) + (upload || 0),
      is_gateway_routed: isRouted ? 1 : 0
    };
  }

  // 1. Process all devices in the devices table
  for (const dev of devices) {
    seenIps.add(dev.ip_address);
    const flowInfo = flowMap.get(dev.ip_address);
    resolved.push(processDevice(dev.ip_address, dev.mac_address, dev, flowInfo));
  }

  // 2. Process any active flow IPs that are NOT present in the devices table (e.g. dynamic client IPs)
  for (const flow of flowsBandwidth) {
    if (!flow.src_ip || seenIps.has(flow.src_ip)) continue;
    seenIps.add(flow.src_ip);
    resolved.push(processDevice(flow.src_ip, flow.src_mac, null, flow));
  }

  // 3. Filter list based on role (Admin vs Agent)
  let filtered = resolved;
  if (agentUuid && AGENT_MAC_MAP[agentUuid]) {
    const macs = AGENT_MAC_MAP[agentUuid];
    filtered = resolved.filter(dev => {
      // Direct MAC check
      if (macs.includes(dev.mac_address)) {
        // But if it is the routed gateway MAC, only keep if it belongs to the agent's subnet/IP range
        if (dev.mac_address === '04:f4:1c:ce:c2:e6') {
          return dev.ip_address.startsWith('10.6.');
        }
        return true;
      }
      // Subnet check for client IPs
      if (dev.ip_address) {
        const octets = dev.ip_address.split('.');
        if (octets.length === 4) {
          if (agentUuid === '8A-V3-PB-85') return octets[0] === '10' && octets[1] === '6';
          if (agentUuid === '2F-TF-1D-GK') return octets[0] === '10' && octets[1] === '6';
          if (agentUuid === 'F6-2V-DT-8A') return octets[0] === '10' && octets[1] === '6';
        }
      }
      return false;
    });
  } else if (siteUuid) {
    filtered = resolved.filter(dev => dev.site_uuid === siteUuid);
  }

  // 4. Sort by download DESC
  filtered.sort((a, b) => b.download - a.download);
  return filtered.slice(0, limit);
}

function getLatestFlows(limit = 100, siteUuid = null, agentUuid = null) {
  const d      = getDB();
  const latest = d.prepare(`SELECT MAX(fetched_at) as t FROM flows`).get();
  if (!latest?.t) return [];

  if (agentUuid && AGENT_MAC_MAP[agentUuid]) {
    const macs = AGENT_MAC_MAP[agentUuid];
    const placeholders = macs.map(() => '?').join(',');
    return d.prepare(`
      SELECT * FROM flows 
      WHERE src_mac IN (${placeholders}) AND fetched_at = ? 
      ORDER BY bytes_download DESC 
      LIMIT ?
    `).all(...macs, latest.t, limit);
  }

  return d.prepare(`
    SELECT * FROM flows WHERE (@siteUuid IS NULL OR site_uuid = @siteUuid) AND  fetched_at = @fetched_at ORDER BY bytes_download DESC LIMIT @limit
  `).all({ fetched_at: latest.t, limit, siteUuid });
}

function getLatestThreats(limit = 50, siteUuid = null, agentUuid = null) {
  const d = getDB();
  if (agentUuid && AGENT_MAC_MAP[agentUuid]) {
    const macs = AGENT_MAC_MAP[agentUuid];
    const placeholders = macs.map(() => '?').join(',');
    return d.prepare(`
      SELECT * FROM threats 
      WHERE mac_address IN (${placeholders}) OR ip_address IN (SELECT DISTINCT src_ip FROM flows WHERE src_mac IN (${placeholders}))
      ORDER BY fetched_at DESC 
      LIMIT ?
    `).all(...macs, ...macs, limit);
  }
  return d.prepare(`SELECT * FROM threats WHERE (@siteUuid IS NULL OR site_uuid = @siteUuid) ORDER BY fetched_at DESC LIMIT @limit`).all({ limit, siteUuid });
}

function getLatestProtocols(limit = 20, siteUuid = null, agentUuid = null) {
  const d      = getDB();
  const latest = d.prepare(`SELECT MAX(fetched_at) as t FROM flows`).get();
  if (!latest?.t) return [];

  if (agentUuid && AGENT_MAC_MAP[agentUuid]) {
    const macs = AGENT_MAC_MAP[agentUuid];
    const placeholders = macs.map(() => '?').join(',');
    return d.prepare(`
      SELECT protocol AS protocol_label, SUM(bytes_download) AS download, SUM(bytes_upload) AS upload, COUNT(*) AS flow_count
      FROM flows
      WHERE src_mac IN (${placeholders}) AND fetched_at = ?
      GROUP BY protocol
      ORDER BY download DESC
      LIMIT ?
    `).all(...macs, latest.t, limit);
  }

  const protoLatest = d.prepare(`SELECT MAX(fetched_at) as t FROM bandwidth_protocols`).get();
  if (!protoLatest?.t) return [];
  return d.prepare(`
    SELECT * FROM bandwidth_protocols WHERE (@siteUuid IS NULL OR site_uuid = @siteUuid) AND fetched_at = @fetched_at ORDER BY download DESC LIMIT @limit
  `).all({ fetched_at: protoLatest.t, limit, siteUuid });
}

function getLatestCountries(limit = 15, siteUuid = null, agentUuid = null) {
  const d      = getDB();
  const latest = d.prepare(`SELECT MAX(fetched_at) as t FROM intel_ip_reputation`).get();
  if (!latest?.t) return [];

  if (agentUuid && AGENT_MAC_MAP[agentUuid]) {
    const macs = AGENT_MAC_MAP[agentUuid];
    const placeholders = macs.map(() => '?').join(',');
    return d.prepare(`
      SELECT country AS country_name, SUM(download) AS download, SUM(upload) AS upload, COUNT(*) AS flow_count
      FROM intel_ip_reputation
      WHERE (mac_address IN (${placeholders}) OR local_ip IN (SELECT DISTINCT src_ip FROM flows WHERE src_mac IN (${placeholders})))
        AND country IS NOT NULL AND fetched_at = ?
      GROUP BY country
      ORDER BY download DESC
      LIMIT ?
    `).all(...macs, ...macs, latest.t, limit);
  }

  const countryLatest = d.prepare(`SELECT MAX(fetched_at) as t FROM bandwidth_countries`).get();
  if (!countryLatest?.t) return [];
  return d.prepare(`
    SELECT * FROM bandwidth_countries WHERE (@siteUuid IS NULL OR site_uuid = @siteUuid) AND fetched_at = @fetched_at ORDER BY download DESC LIMIT @limit
  `).all({ fetched_at: countryLatest.t, limit, siteUuid });
}

function getLatestDNS(limit = 20, siteUuid = null, agentUuid = null) {
  const d      = getDB();
  const latest = d.prepare(`SELECT MAX(fetched_at) as t FROM flows`).get();
  if (!latest?.t) return [];

  if (agentUuid && AGENT_MAC_MAP[agentUuid]) {
    const macs = AGENT_MAC_MAP[agentUuid];
    const placeholders = macs.map(() => '?').join(',');
    return d.prepare(`
      SELECT domain, COUNT(*) AS query_count, app_label, 'Web' AS category
      FROM flows
      WHERE src_mac IN (${placeholders}) AND domain IS NOT NULL AND fetched_at = ?
      GROUP BY domain
      ORDER BY query_count DESC
      LIMIT ?
    `).all(...macs, latest.t, limit);
  }

  const dnsLatest = d.prepare(`SELECT MAX(fetched_at) as t FROM dns_queries`).get();
  if (!dnsLatest?.t) return [];
  return d.prepare(`
    SELECT * FROM dns_queries WHERE (@siteUuid IS NULL OR site_uuid = @siteUuid) AND  fetched_at = @fetched_at ORDER BY query_count DESC LIMIT @limit
  `).all({ fetched_at: dnsLatest.t, limit, siteUuid });
}

function getLatestEvents(limit = 50, siteUuid = null, agentUuid = null) {
  const d = getDB();
  if (agentUuid && AGENT_MAC_MAP[agentUuid]) {
    const macs = AGENT_MAC_MAP[agentUuid];
    const placeholders = macs.map(() => '?').join(',');
    return d.prepare(`
      SELECT * FROM events 
      WHERE mac_address IN (${placeholders}) OR ip_address IN (SELECT DISTINCT src_ip FROM flows WHERE src_mac IN (${placeholders}))
      ORDER BY fetched_at DESC 
      LIMIT ?
    `).all(...macs, ...macs, limit);
  }
  return d.prepare(`SELECT * FROM events WHERE (@siteUuid IS NULL OR site_uuid = @siteUuid) ORDER BY fetched_at DESC LIMIT @limit`).all({ limit, siteUuid });
}

function getBandwidthTimeline(points = 60, siteUuid = null, agentUuid = null) {
  const d = getDB();
  if (agentUuid && AGENT_MAC_MAP[agentUuid]) {
    const macs = AGENT_MAC_MAP[agentUuid];
    const placeholders = macs.map(() => '?').join(',');
    return d.prepare(`
      SELECT fetched_at, SUM(download) AS total_download, SUM(upload) AS total_upload,
             0 AS total_flows, 0 AS active_devices
      FROM mac_bandwidth
      WHERE mac_address IN (${placeholders})
      GROUP BY fetched_at
      ORDER BY fetched_at DESC
      LIMIT ?
    `).all(...macs, points).reverse();
  }
  return d.prepare(`
    SELECT * FROM bandwidth_timeline WHERE (@siteUuid IS NULL OR site_uuid = @siteUuid) ORDER BY fetched_at DESC LIMIT @limit
  `).all({ limit: points, siteUuid }).reverse();
}

function getStats(siteUuid = null, agentUuid = null) {
  const d = getDB();

  if (agentUuid && AGENT_MAC_MAP[agentUuid]) {
    const macs = AGENT_MAC_MAP[agentUuid];
    const placeholders = macs.map(() => '?').join(',');
    
    // Count active devices for this agent
    const totalDevices = getLatestDevices(1000, siteUuid, agentUuid).length;

    // Count active flows for this agent
    const latestFlowFetch = d.prepare(`SELECT MAX(fetched_at) as t FROM flows`).get();
    const activeFlows = latestFlowFetch?.t
      ? (d.prepare(`
          SELECT COUNT(*) as n FROM flows 
          WHERE src_mac IN (${placeholders}) AND fetched_at = ?
        `).get(...macs, latestFlowFetch.t)?.n ?? 0)
      : 0;

    // Count threats for this agent
    const totalThreats = d.prepare(`
      SELECT COUNT(*) as n FROM threats 
      WHERE mac_address IN (${placeholders}) OR ip_address IN (SELECT DISTINCT src_ip FROM flows WHERE src_mac IN (${placeholders}))
    `).get(...macs, ...macs)?.n ?? 0;

    // Count events for this agent
    const totalEvents = d.prepare(`
      SELECT COUNT(*) as n FROM events 
      WHERE mac_address IN (${placeholders}) OR ip_address IN (SELECT DISTINCT src_ip FROM flows WHERE src_mac IN (${placeholders}))
    `).get(...macs, ...macs)?.n ?? 0;

    const lastFetch = d.prepare(`SELECT MAX(fetched_at) as t FROM flows`).get()?.t ?? null;

    // Construct latest bandwidth timeline summary for this agent
    const latestBw = latestFlowFetch?.t
      ? d.prepare(`
          SELECT SUM(bytes_download) AS total_download, SUM(bytes_upload) AS total_upload,
                 COUNT(*) AS total_flows, COUNT(DISTINCT src_ip) AS active_devices, ? as fetched_at
          FROM flows
          WHERE src_mac IN (${placeholders}) AND fetched_at = ?
        `).get(latestFlowFetch.t, ...macs, latestFlowFetch.t)
      : {};

    return { totalDevices, activeFlows, totalThreats, totalEvents, lastFetch, latestBw };
  }

  // Fallback to site-wide stats if no agentUuid
  const latestDevFetch = d.prepare(`SELECT MAX(fetched_at) as t FROM devices`).get();
  const totalDevices = latestDevFetch?.t
    ? (d.prepare(`SELECT COUNT(*) as n FROM devices WHERE (@siteUuid IS NULL OR site_uuid = @siteUuid) AND fetched_at = @fetched_at`).get({ fetched_at: latestDevFetch.t, siteUuid })?.n ?? 0)
    : 0;

  const latestFlowFetch = d.prepare(`SELECT MAX(fetched_at) as t FROM flows`).get();
  const activeFlows = latestFlowFetch?.t
    ? (d.prepare(`SELECT COUNT(*) as n FROM flows WHERE (@siteUuid IS NULL OR site_uuid = @siteUuid) AND fetched_at = @fetched_at`).get({ fetched_at: latestFlowFetch.t, siteUuid })?.n ?? 0)
    : 0;

  const totalThreats = d.prepare(`SELECT COUNT(*) as n FROM threats WHERE (@siteUuid IS NULL OR site_uuid = @siteUuid)`).get({ siteUuid })?.n ?? 0;
  const totalEvents  = d.prepare(`SELECT COUNT(*) as n FROM events WHERE (@siteUuid IS NULL OR site_uuid = @siteUuid)`).get({ siteUuid })?.n  ?? 0;
  const lastFetch    = d.prepare(`SELECT MAX(fetched_at) as t FROM bandwidth_timeline`).get()?.t ?? null;
  const latestBw     = d.prepare(`SELECT * FROM bandwidth_timeline WHERE (@siteUuid IS NULL OR site_uuid = @siteUuid) ORDER BY fetched_at DESC LIMIT 1`).get({ siteUuid });

  return { totalDevices, activeFlows, totalThreats, totalEvents, lastFetch, latestBw };
}

// ─── INSERT FITUR BARU 1-11 ───────────────────────────────────────────────────
function insertAppCategories(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO app_categories
    (site_uuid, fetched_at, category_label, download, upload, total)
    VALUES (?, ?,?,?,?,?)`);
  d.transaction(items => { for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.category_label, r.download, r.upload, r.total); })(rows);
}

function insertContinents(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO continents
    (site_uuid, fetched_at, continent_name, download, upload, total)
    VALUES (?, ?,?,?,?,?)`);
  d.transaction(items => { for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.continent_name, r.download, r.upload, r.total); })(rows);
}

function insertRegions(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO regions
    (site_uuid, fetched_at, region_name, region_code, country_name, country_code, download)
    VALUES (?, ?,?,?,?,?,?)`);
  d.transaction(items => { for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.region_name, r.region_code, r.country_name, r.country_code, r.download); })(rows);
}

function insertCities(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO cities
    (site_uuid, fetched_at, city_name, region_name, country_name, country_code, download)
    VALUES (?, ?,?,?,?,?,?)`);
  d.transaction(items => { for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.city_name, r.region_name, r.country_name, r.country_code, r.download); })(rows);
}

function insertVLANs(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO vlans
    (site_uuid, fetched_at, vlan_id, vlan_label, download, upload, total)
    VALUES (?, ?,?,?,?,?,?)`);
  d.transaction(items => { for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.vlan_id, r.vlan_label, r.download, r.upload, r.total); })(rows);
}

function insertInterfaces(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO interfaces
    (site_uuid, fetched_at, iface_id, iface_name, iface_role, agent_id, download, upload, total)
    VALUES (?, ?,?,?,?,?,?,?,?)`);
  d.transaction(items => { for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.iface_id, r.iface_name, r.iface_role, String(r.agent_id ?? ''), r.download, r.upload, r.total); })(rows);
}

function insertFlowTypes(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO flow_types
    (site_uuid, fetched_at, flow_type_label, download, upload, total)
    VALUES (?, ?,?,?,?,?)`);
  d.transaction(items => { for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.flow_type_label, r.download, r.upload, r.total); })(rows);
}

function insertFlowOrigins(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO flow_origins
    (site_uuid, fetched_at, flow_origin_label, download, upload, total)
    VALUES (?, ?,?,?,?,?)`);
  d.transaction(items => { for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.flow_origin_label, r.download, r.upload, r.total); })(rows);
}

function insertIPVersions(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO ip_versions
    (site_uuid, fetched_at, ip_version_label, download, upload, total)
    VALUES (?, ?,?,?,?,?)`);
  d.transaction(items => { for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.ip_version_label, r.download, r.upload, r.total); })(rows);
}

function insertRemoteIPs(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO remote_ips
    (site_uuid, fetched_at, remote_ip, ip_version, download, upload, total)
    VALUES (?, ?,?,?,?,?,?)`);
  d.transaction(items => { for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.remote_ip, r.ip_version, r.download, r.upload, r.total); })(rows);
}

function insertMACBandwidth(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO mac_bandwidth
    (site_uuid, fetched_at, mac_address, manufacturer, download, upload, total)
    VALUES (?, ?,?,?,?,?,?)`);
  d.transaction(items => { for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.mac_address, r.manufacturer, r.download, r.upload, r.total); })(rows);
}

// ─── QUERY FITUR BARU ─────────────────────────────────────────────────────────
function getLatest(table, orderBy = 'download', limit = 50, siteUuid = null, agentUuid = null) {
  const d = getDB();
  const latest = d.prepare(`SELECT MAX(fetched_at) as t FROM ${table}`).get();
  if (!latest?.t) return [];

  let rows = [];

  // If agentUuid is provided, handle direct MAC or interface filtering
  const macs = agentUuid ? AGENT_MAC_MAP[agentUuid] : null;
  if (agentUuid && macs) {
    if (table === 'mac_bandwidth') {
      const placeholders = macs.map(() => '?').join(',');
      rows = d.prepare(`SELECT * FROM mac_bandwidth WHERE fetched_at = ? AND mac_address IN (${placeholders}) ORDER BY ${orderBy} DESC LIMIT ?`).all(latest.t, ...macs, limit);
      return rows;
    }
    if (table === 'interfaces') {
      const numericIds = AGENT_NUMERIC_IDS[agentUuid] || [];
      if (numericIds.length > 0) {
        const placeholders = numericIds.map(() => '?').join(',');
        rows = d.prepare(`SELECT * FROM interfaces WHERE fetched_at = ? AND agent_id IN (${placeholders}) ORDER BY ${orderBy} DESC LIMIT ?`).all(latest.t, ...numericIds, limit);
        return rows;
      }
    }
    if (table === 'remote_ips') {
      const latestFlowsFetch = d.prepare("SELECT MAX(fetched_at) as t FROM flows").get();
      if (latestFlowsFetch?.t) {
        const placeholders = macs.map(() => '?').join(',');
        rows = d.prepare(`
          SELECT dst_ip AS remote_ip, 
                 CASE WHEN dst_ip LIKE '%:%' THEN 6 ELSE 4 END AS ip_version,
                 SUM(bytes_download) AS download, 
                 SUM(bytes_upload) AS upload, 
                 SUM(bytes_download + bytes_upload) AS total
          FROM flows
          WHERE src_mac IN (${placeholders}) AND fetched_at = ?
          GROUP BY dst_ip
          ORDER BY download DESC
          LIMIT ?
        `).all(...macs, latestFlowsFetch.t, limit);
        return rows;
      }
    }
    if (table === 'dns_queries') {
      const latestFlowsFetch = d.prepare("SELECT MAX(fetched_at) as t FROM flows").get();
      if (latestFlowsFetch?.t) {
        const placeholders = macs.map(() => '?').join(',');
        rows = d.prepare(`
          SELECT domain, COUNT(*) AS query_count
          FROM flows
          WHERE src_mac IN (${placeholders}) AND fetched_at = ? AND domain IS NOT NULL
          GROUP BY domain
          ORDER BY query_count DESC
          LIMIT ?
        `).all(...macs, latestFlowsFetch.t, limit);
        return rows;
      }
    }
  }

  // Fallback to standard site-wide select
  rows = d.prepare(`SELECT * FROM ${table} WHERE (@siteUuid IS NULL OR site_uuid = @siteUuid) AND fetched_at = @fetched_at ORDER BY ${orderBy} DESC LIMIT @limit`).all({ fetched_at: latest.t, limit, siteUuid });

  // If agentUuid is provided, scale down numerical values by traffic ratio to match the agent's footprint
  if (agentUuid && !['mac_bandwidth', 'interfaces'].includes(table)) {
    const ratio = getAgentTrafficRatio(agentUuid);
    return rows.map(r => ({
      ...r,
      download: Math.round((r.download || 0) * ratio),
      upload: Math.round((r.upload || 0) * ratio),
      total: Math.round((r.total || 0) * ratio),
      query_count: Math.round((r.query_count || 0) * ratio),
      flow_count: Math.round((r.flow_count || 0) * ratio),
    }));
  }

  return rows;
}

// DPI Fields
function insertTLSVersions(rows, fetchedAt, siteUuid) {
  const d    = getDB();
  const stmt = d.prepare(`INSERT INTO tls_versions
    (site_uuid, fetched_at, tls_version, download, upload, total)
    VALUES (?, ?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.tls_version, r.download, r.upload, r.total);
  })(rows);
}

function insertTLSCiphers(rows, fetchedAt, siteUuid) {
  const d    = getDB();
  const stmt = d.prepare(`INSERT INTO tls_ciphers
    (site_uuid, fetched_at, tls_cipher, download, upload, total)
    VALUES (?, ?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.tls_cipher, r.download, r.upload, r.total);
  })(rows);
}

function insertTLSSecurity(rows, fetchedAt, siteUuid) {
  const d    = getDB();
  const stmt = d.prepare(`INSERT INTO tls_security
    (site_uuid, fetched_at, tls_security, color, download, upload, total)
    VALUES (?, ?,?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.tls_security, r.color, r.download, r.upload, r.total);
  })(rows);
}

function insertNetBIOSHostnames(rows, fetchedAt, siteUuid) {
  const d    = getDB();
  const stmt = d.prepare(`INSERT INTO netbios_hostnames
    (site_uuid, fetched_at, hostname, download, upload, total)
    VALUES (?, ?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.hostname, r.download, r.upload, r.total);
  })(rows);
}

function insertDiscoveryOS(rows, fetchedAt, siteUuid) {
  const d    = getDB();
  const stmt = d.prepare(`INSERT INTO discovery_os
    (site_uuid, fetched_at, os_label, download, upload, total)
    VALUES (?, ?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.os_label, r.download, r.upload, r.total);
  })(rows);
}

// ─── INSERT DPI 12-21 ────────────────────────────────────────────────────────

function insertDHCPFingerprints(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO dhcp_fingerprints
    (site_uuid, fetched_at, fingerprint, download, upload, total)
    VALUES (?, ?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.fingerprint, r.download, r.upload, r.total);
  })(rows);
}

function insertHTTPUserAgents(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO http_user_agents
    (site_uuid, fetched_at, user_agent, download, upload, total)
    VALUES (?, ?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.user_agent, r.download, r.upload, r.total);
  })(rows);
}

function insertSNIHostnames(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO sni_hostnames
    (site_uuid, fetched_at, sni_hostname, download, upload, total)
    VALUES (?, ?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.sni_hostname, r.download, r.upload, r.total);
  })(rows);
}

function insertSSLServerCN(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO ssl_server_cn
    (site_uuid, fetched_at, ssl_server_cn, download, upload, total)
    VALUES (?, ?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.ssl_server_cn, r.download, r.upload, r.total);
  })(rows);
}

function insertQUICHostnames(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO quic_hostnames
    (site_uuid, fetched_at, quic_hostname, download, upload, total)
    VALUES (?, ?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.quic_hostname, r.download, r.upload, r.total);
  })(rows);
}

function insertBitTorrentHashes(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO bittorrent_hashes
    (site_uuid, fetched_at, info_hash, label, download, upload, total)
    VALUES (?, ?,?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.info_hash, r.label, r.download, r.upload, r.total);
  })(rows);
}

function insertSSHVersions(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO ssh_versions
    (site_uuid, fetched_at, ssh_version, download, upload, total)
    VALUES (?, ?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.ssh_version, r.download, r.upload, r.total);
  })(rows);
}

function insertMDNSHostnames(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO mdns_hostnames
    (site_uuid, fetched_at, mdns_hostname, download, upload, total)
    VALUES (?, ?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.mdns_hostname, r.download, r.upload, r.total);
  })(rows);
}

// ─── INSERT INTELLIGENCE 22-30 ────────────────────────────────────────────────

function insertCryptoMining(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO intel_crypto_mining
    (site_uuid, fetched_at, detected_at, ip_address, mac_address, pool_host, pool_ip, protocol, app_label, confidence, download, upload)
    VALUES (?, ?,?,?,?,?,?,?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.detected_at ?? fetchedAt, r.ip_address, r.mac_address,
      r.pool_host, r.pool_ip, r.protocol, r.app_label, r.confidence,
      r.download ?? 0, r.upload ?? 0
    );
  })(rows);
}

function insertDeviceDiscovery(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO intel_device_discovery
    (site_uuid, fetched_at, detected_at, ip_address, mac_address, device_label, device_type, os_label, manufacturer, is_new)
    VALUES (?, ?,?,?,?,?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.detected_at ?? fetchedAt, r.ip_address, r.mac_address,
      r.device_label, r.device_type, r.os_label, r.manufacturer,
      r.is_new ? 1 : 0
    );
  })(rows);
}

function insertEncryptionAudit(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO intel_encryption_audit
    (site_uuid, fetched_at, detected_at, ip_address, mac_address, device_label, encrypted_pct, unencrypted, encrypted, total, risk_level)
    VALUES (?, ?,?,?,?,?,?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.detected_at ?? fetchedAt, r.ip_address, r.mac_address,
      r.device_label, r.encrypted_pct, r.unencrypted ?? 0, r.encrypted ?? 0,
      r.total ?? 0, r.risk_level
    );
  })(rows);
}

function insertInsecureProtocols(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO intel_insecure_protocols
    (site_uuid, fetched_at, detected_at, protocol, ip_address, mac_address, dst_ip, dst_port, app_label, download, upload, risk, source)
    VALUES (?, ?,?,?,?,?,?,?,?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.detected_at ?? fetchedAt, r.protocol, r.ip_address, r.mac_address,
      r.dst_ip, r.dst_port, r.app_label, r.download ?? 0, r.upload ?? 0,
      r.risk ?? 'Medium', r.source ?? 'api'
    );
  })(rows);
}

function insertIPReputation(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO intel_ip_reputation
    (site_uuid, fetched_at, detected_at, ip_address, local_ip, mac_address, reputation, score, country, app_label, download, upload, blacklisted)
    VALUES (?, ?,?,?,?,?,?,?,?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.detected_at ?? fetchedAt, r.ip_address, r.local_ip, r.mac_address,
      r.reputation, r.score, r.country, r.app_label,
      r.download ?? 0, r.upload ?? 0, r.blacklisted ? 1 : 0
    );
  })(rows);
}

function insertServerDiscovery(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO intel_server_discovery
    (site_uuid, fetched_at, detected_at, ip_address, mac_address, server_type, hostname, port, protocol, os_label, download, upload)
    VALUES (?, ?,?,?,?,?,?,?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.detected_at ?? fetchedAt, r.ip_address, r.mac_address,
      r.server_type, r.hostname, r.port, r.protocol, r.os_label,
      r.download ?? 0, r.upload ?? 0
    );
  })(rows);
}

function insertTorDetection(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO intel_tor_detection
    (site_uuid, fetched_at, detected_at, ip_address, mac_address, exit_node, circuit_id, download, upload, country)
    VALUES (?, ?,?,?,?,?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.detected_at ?? fetchedAt, r.ip_address, r.mac_address,
      r.exit_node, r.circuit_id, r.download ?? 0, r.upload ?? 0, r.country
    );
  })(rows);
}

function insertUnencryptedPasswords(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO intel_unencrypted_passwords
    (site_uuid, fetched_at, detected_at, ip_address, mac_address, dst_ip, dst_port, protocol, username, download, upload, severity)
    VALUES (?, ?,?,?,?,?,?,?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.detected_at ?? fetchedAt, r.ip_address, r.mac_address,
      r.dst_ip, r.dst_port, r.protocol, r.username,
      r.download ?? 0, r.upload ?? 0, r.severity ?? 'Critical'
    );
  })(rows);
}

function insertVPNDetection(rows, fetchedAt, siteUuid) {
  const d = getDB();
  const stmt = d.prepare(`INSERT INTO intel_vpn_detection
    (site_uuid, fetched_at, detected_at, ip_address, mac_address, vpn_type, remote_ip, protocol, download, upload, country, confidence)
    VALUES (?, ?,?,?,?,?,?,?,?,?,?,?)`);
  d.transaction(items => {
    for (const r of items) stmt.run(
    siteUuid, fetchedAt, r.detected_at ?? fetchedAt, r.ip_address, r.mac_address,
      r.vpn_type, r.remote_ip, r.protocol,
      r.download ?? 0, r.upload ?? 0, r.country, r.confidence
    );
  })(rows);
}

// ─── QUERY Intelligence — ambil semua row tanpa batasan fetched_at ────────────
// (karena event ini tidak diposting ulang tiap menit, simpan kumulatif)
function getIntelData(table, limit = 100, siteUuid = null, agentUuid = null) {
  const d = getDB();
  if (agentUuid && AGENT_MAC_MAP[agentUuid]) {
    const macs = AGENT_MAC_MAP[agentUuid];
    const placeholders = macs.map(() => '?').join(',');
    
    // For reputation, the column is local_ip, not ip_address
    const ipField = table === 'intel_ip_reputation' ? 'local_ip' : 'ip_address';
    
    return d.prepare(`
      SELECT * FROM ${table} 
      WHERE mac_address IN (${placeholders}) OR ${ipField} IN (SELECT DISTINCT src_ip FROM flows WHERE src_mac IN (${placeholders}))
      ORDER BY fetched_at DESC 
      LIMIT ?
    `).all(...macs, ...macs, limit);
  }
  return d.prepare(`SELECT * FROM ${table} WHERE (@siteUuid IS NULL OR site_uuid = @siteUuid) ORDER BY fetched_at DESC LIMIT @limit`).all({ limit, siteUuid });
}

function getIntelStats(siteUuid = null, agentUuid = null) {
  const d = getDB();
  const tables = [
    'intel_crypto_mining', 'intel_device_discovery', 'intel_encryption_audit',
    'intel_insecure_protocols', 'intel_ip_reputation', 'intel_server_discovery',
    'intel_tor_detection', 'intel_unencrypted_passwords', 'intel_vpn_detection',
  ];
  const counts = {};
  
  const macs = agentUuid ? AGENT_MAC_MAP[agentUuid] : null;
  const placeholders = macs ? macs.map(() => '?').join(',') : '';

  for (const t of tables) {
    try {
      if (agentUuid && macs) {
        const ipField = t === 'intel_ip_reputation' ? 'local_ip' : 'ip_address';
        counts[t] = d.prepare(`
          SELECT COUNT(*) as n FROM ${t} 
          WHERE mac_address IN (${placeholders}) OR ${ipField} IN (SELECT DISTINCT src_ip FROM flows WHERE src_mac IN (${placeholders}))
        `).get(...macs, ...macs)?.n ?? 0;
      } else {
        counts[t] = d.prepare(`SELECT COUNT(*) as n FROM ${t} WHERE (@siteUuid IS NULL OR site_uuid = @siteUuid)`).get({ siteUuid })?.n ?? 0;
      }
    } catch { counts[t] = 0; }
  }
  return counts;
}

function getDataInterval() {
  const d = getDB();
  const row = d.prepare("SELECT MIN(fetched_at) as start_t, MAX(fetched_at) as end_t FROM devices").get();
  return {
    start: row?.start_t || null,
    end: row?.end_t || null
  };
}

module.exports = {
  getUserByUsername,
  updateUserPassword,
  getDB,
  getDataInterval,
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

// ─── AUTHENTICATION ─────────────────────────────────────────────────────────
function getUserByUsername(username) {
  return getDB().prepare('SELECT * FROM users WHERE username = ?').get(username);
}

function updateUserPassword(userId, newPasswordHash) {
  return getDB().prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newPasswordHash, userId);
}
