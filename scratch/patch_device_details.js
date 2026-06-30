// patch_device_details.js — replaces fetchDeviceDetails in netify.js
const fs   = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'backend', 'netify.js');
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = '// Fetch data for a specific device IP — from local DB flows + intel tables\r\nasync function fetchDeviceDetails(ip) {';
const endMarker   = '}\r\n\r\n// Fetch data for a specific application';

const startIdx = content.indexOf(startMarker);
const endIdx   = content.indexOf('// Fetch data for a specific application');

if (startIdx === -1) { console.error('START not found'); process.exit(1); }
if (endIdx   === -1) { console.error('END not found'); process.exit(1); }

console.log(`Found fetchDeviceDetails: char ${startIdx} → ${endIdx}`);

const replacement = `// Fetch data for a specific device IP — from local DB (all 10 correlated tables)
async function fetchDeviceDetails(ip) {
  const db = require('./database');
  const d  = db.getDB();

  // ── 0. Resolve MAC from flows (most recent) ──────────────────────────────
  const macRow = d.prepare(\`SELECT src_mac FROM flows WHERE src_ip = ? AND src_mac IS NOT NULL ORDER BY last_seen DESC LIMIT 1\`).get(ip);
  const mac = macRow?.src_mac || null;

  // ── 1. Device info from devices table ────────────────────────────────────
  const deviceRow = d.prepare(\`
    SELECT device_label, device_type, os_label, manufacturer, download, upload, last_seen
    FROM   devices
    WHERE  ip_address = ?
    ORDER  BY fetched_at DESC
    LIMIT  1
  \`).get(ip);

  // ── 2. Discovery info (may differ from devices table) ────────────────────
  const discRow = d.prepare(\`
    SELECT device_type, os_label, manufacturer, device_label, is_new
    FROM   intel_device_discovery
    WHERE  ip_address = ?
    ORDER  BY fetched_at DESC
    LIMIT  1
  \`).get(ip);

  const device_info = {
    device_label : deviceRow?.device_label || discRow?.device_label || null,
    device_type  : deviceRow?.device_type  || discRow?.device_type  || null,
    os_label     : deviceRow?.os_label     || discRow?.os_label     || null,
    manufacturer : deviceRow?.manufacturer || discRow?.manufacturer || null,
    mac_address  : mac,
    is_new       : discRow?.is_new ?? null,
  };

  // ── 3. Top apps (flows GROUP BY app_label) ─────────────────────────────
  const appRows = d.prepare(\`
    SELECT app_label,
           SUM(bytes_download) AS download,
           SUM(bytes_upload)   AS upload,
           COUNT(*)            AS flow_count
    FROM   flows
    WHERE  src_ip = ?
      AND  app_label IS NOT NULL
    GROUP  BY app_label
    ORDER  BY download DESC
    LIMIT  20
  \`).all(ip);

  const top_apps = appRows.map(r => ({
    app_label  : r.app_label,
    download   : r.download ?? 0,
    upload     : r.upload   ?? 0,
    flow_count : r.flow_count,
  }));

  // ── 4. Top domains (flows GROUP BY domain) ─────────────────────────────
  const domainRows = d.prepare(\`
    SELECT domain,
           SUM(bytes_download) AS download,
           SUM(bytes_upload)   AS upload,
           COUNT(*)            AS flow_count
    FROM   flows
    WHERE  src_ip = ?
      AND  domain IS NOT NULL
    GROUP  BY domain
    ORDER  BY download DESC
    LIMIT  20
  \`).all(ip);

  // ── 5. Recent flows ────────────────────────────────────────────────────
  const flowRows = d.prepare(\`
    SELECT dst_ip, dst_port, protocol, app_label, domain,
           bytes_download AS download, bytes_upload AS upload, last_seen
    FROM   flows
    WHERE  src_ip = ?
    ORDER  BY last_seen DESC
    LIMIT  100
  \`).all(ip);

  const flows = flowRows.map(r => ({
    dst_ip    : r.dst_ip,
    dst_port  : r.dst_port,
    protocol  : r.protocol,
    app_label : r.app_label,
    domain    : r.domain,
    download  : r.download ?? 0,
    upload    : r.upload   ?? 0,
    last_seen : r.last_seen,
  }));

  // ── 6. Totals ─────────────────────────────────────────────────────────
  const sumRow = d.prepare(\`
    SELECT SUM(bytes_download) AS total_download,
           SUM(bytes_upload)   AS total_upload,
           COUNT(*) AS flow_count
    FROM   flows
    WHERE  src_ip = ?
  \`).get(ip);

  // ── 7. Encryption audit (latest snapshot) ─────────────────────────────
  const latestAudit = d.prepare(\`SELECT MAX(fetched_at) AS t FROM intel_encryption_audit\`).get()?.t;
  const encRow = latestAudit
    ? d.prepare(\`
        SELECT encrypted_pct, encrypted, unencrypted, total, risk_level, mac_address
        FROM   intel_encryption_audit
        WHERE  fetched_at = ? AND ip_address = ?
        LIMIT  1
      \`).get(latestAudit, ip)
    : null;

  // Also try fallback by MAC if not found by IP
  const encRowMac = (!encRow && mac && latestAudit)
    ? d.prepare(\`
        SELECT encrypted_pct, encrypted, unencrypted, total, risk_level, ip_address
        FROM   intel_encryption_audit
        WHERE  fetched_at = ? AND mac_address = ?
        ORDER  BY detected_at DESC
        LIMIT  1
      \`).get(latestAudit, mac)
    : null;

  const encFinal = encRow || encRowMac;

  const encryption = encFinal ? {
    encrypted_pct   : encFinal.encrypted_pct   ?? null,
    encrypted_bytes : encFinal.encrypted        ?? null,
    unencrypted_bytes: encFinal.unencrypted     ?? null,
    total_bytes     : encFinal.total            ?? null,
    risk_level      : encFinal.risk_level       ?? null,
  } : null;

  // ── 8. Server discovery (servers this device accessed) ─────────────────
  const serverRows = d.prepare(\`
    SELECT DISTINCT server_type, hostname, port, protocol, os_label,
           MAX(download) AS download, MAX(upload) AS upload, MAX(detected_at) AS detected_at
    FROM   intel_server_discovery
    WHERE  ip_address = ?
    GROUP  BY server_type, port, protocol
    ORDER  BY download DESC
    LIMIT  50
  \`).all(ip);

  // fallback by MAC if no rows by IP
  const serverRowsMac = (serverRows.length === 0 && mac)
    ? d.prepare(\`
        SELECT DISTINCT server_type, hostname, port, protocol, os_label,
               MAX(download) AS download, MAX(upload) AS upload, MAX(detected_at) AS detected_at
        FROM   intel_server_discovery
        WHERE  mac_address = ?
        GROUP  BY server_type, port, protocol
        ORDER  BY download DESC
        LIMIT  50
      \`).all(mac)
    : [];

  const server_discovery = (serverRows.length > 0 ? serverRows : serverRowsMac).map(r => ({
    server_type : r.server_type,
    hostname    : r.hostname || null,
    port        : r.port,
    protocol    : r.protocol,
    os_label    : r.os_label || null,
    download    : r.download ?? 0,
    upload      : r.upload   ?? 0,
    detected_at : r.detected_at,
  }));

  // ── 9. Unencrypted passwords ───────────────────────────────────────────
  let pwdRows = d.prepare(\`
    SELECT dst_ip, dst_port, protocol, username, severity, download, upload, detected_at
    FROM   intel_unencrypted_passwords
    WHERE  ip_address = ?
    ORDER  BY detected_at DESC
    LIMIT  50
  \`).all(ip);

  if (pwdRows.length === 0 && mac) {
    pwdRows = d.prepare(\`
      SELECT dst_ip, dst_port, protocol, username, severity, download, upload, detected_at
      FROM   intel_unencrypted_passwords
      WHERE  mac_address = ?
      ORDER  BY detected_at DESC
      LIMIT  50
    \`).all(mac);
  }

  const unencrypted_passwords = pwdRows.map(r => ({
    dst_ip      : r.dst_ip,
    dst_port    : r.dst_port,
    protocol    : r.protocol,
    username    : r.username,
    severity    : r.severity,
    download    : r.download ?? 0,
    upload      : r.upload   ?? 0,
    detected_at : r.detected_at,
  }));

  // ── 10. IP Reputation (latest snapshot, this device's local_ip) ─────────
  const latestRepSnap = d.prepare(\`SELECT MAX(fetched_at) AS t FROM intel_ip_reputation\`).get()?.t;
  const repRows = latestRepSnap
    ? d.prepare(\`
        SELECT ip_address, local_ip, reputation, score, country, app_label, blacklisted, download, upload
        FROM   intel_ip_reputation
        WHERE  fetched_at = ? AND (local_ip = ? OR ip_address = ?)
        ORDER  BY score DESC NULLS LAST
        LIMIT  30
      \`).all(latestRepSnap, ip, ip)
    : [];

  const ip_reputation = repRows.map(r => ({
    remote_ip   : r.ip_address,
    local_ip    : r.local_ip,
    reputation  : r.reputation,
    score       : r.score,
    country     : r.country,
    app_label   : r.app_label,
    blacklisted : !!r.blacklisted,
    download    : r.download ?? 0,
    upload      : r.upload   ?? 0,
  }));

  // ── 11. VPN detection ─────────────────────────────────────────────────
  let vpnRows = d.prepare(\`
    SELECT vpn_type, remote_ip, protocol, country, confidence, download, upload, detected_at
    FROM   intel_vpn_detection
    WHERE  ip_address = ?
    ORDER  BY detected_at DESC
    LIMIT  20
  \`).all(ip);

  if (vpnRows.length === 0 && mac) {
    vpnRows = d.prepare(\`
      SELECT vpn_type, remote_ip, protocol, country, confidence, download, upload, detected_at
      FROM   intel_vpn_detection
      WHERE  mac_address = ?
      ORDER  BY detected_at DESC
      LIMIT  20
    \`).all(mac);
  }

  const vpn_detections = vpnRows.map(r => ({
    vpn_type    : r.vpn_type,
    remote_ip   : r.remote_ip,
    protocol    : r.protocol,
    country     : r.country,
    confidence  : r.confidence,
    download    : r.download ?? 0,
    upload      : r.upload   ?? 0,
    detected_at : r.detected_at,
  }));

  // ── 12. Events ────────────────────────────────────────────────────────
  const evtByIP  = d.prepare(\`SELECT event_type, severity, ip_address, mac_address, description, event_at FROM events WHERE ip_address = ? ORDER BY event_at DESC LIMIT 50\`).all(ip);
  const evtByMAC = mac ? d.prepare(\`SELECT event_type, severity, ip_address, mac_address, description, event_at FROM events WHERE mac_address = ? ORDER BY event_at DESC LIMIT 50\`).all(mac) : [];

  const seenEvt = new Set();
  const evtMerged = [];
  for (const r of [...evtByIP, ...evtByMAC]) {
    const key = \`\${r.event_type}:\${r.event_at}\`;
    if (!seenEvt.has(key)) {
      seenEvt.add(key);
      evtMerged.push({ event_type: r.event_type, severity: r.severity, ip_address: r.ip_address, mac_address: r.mac_address, description: r.description, event_at: r.event_at });
    }
  }
  evtMerged.sort((a, b) => (b.event_at || '').localeCompare(a.event_at || ''));
  const events = evtMerged.slice(0, 100);

  // ── 13. MAC bandwidth (latest snapshot) ───────────────────────────────
  const latestMacSnap = d.prepare(\`SELECT MAX(fetched_at) AS t FROM mac_bandwidth\`).get()?.t;
  const macBwRow = (latestMacSnap && mac)
    ? d.prepare(\`SELECT manufacturer, download, upload, total FROM mac_bandwidth WHERE fetched_at = ? AND mac_address = ? LIMIT 1\`).get(latestMacSnap, mac)
    : null;

  const mac_bandwidth = macBwRow ? {
    mac_address  : mac,
    manufacturer : macBwRow.manufacturer,
    download     : macBwRow.download ?? 0,
    upload       : macBwRow.upload   ?? 0,
    total        : macBwRow.total    ?? 0,
  } : null;

  return {
    ip,
    mac_address    : mac,
    total_download : sumRow?.total_download ?? 0,
    total_upload   : sumRow?.total_upload   ?? 0,
    flow_count     : sumRow?.flow_count     ?? 0,
    device_info,
    top_apps,
    top_domains    : domainRows.map(r => ({ domain: r.domain, download: r.download ?? 0, upload: r.upload ?? 0, flow_count: r.flow_count })),
    flows,
    encryption,
    server_discovery,
    unencrypted_passwords,
    ip_reputation,
    vpn_detections,
    events,
    mac_bandwidth,
  };
}

// Fetch data for a specific application`;

const newContent = content.slice(0, startIdx) + replacement + content.slice(endIdx);
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('SUCCESS: Patched fetchDeviceDetails, new file length:', newContent.length);
