// patch_netify.js — patches the fetchAgentDetails function in netify.js
const fs   = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'backend', 'netify.js');
let content = fs.readFileSync(filePath, 'utf8');

// Find the start marker (after the top_apps mapping block)
const startMarker = '  // ── 2. Distinct devices for this agent ─────────────────────────────────────\n  const devRows = d.prepare(`\n    WHERE  src_mac IN (${ph})\n    ORDER  BY last_seen DESC\n    LIMIT  50\n  `).all(...macs);';

const endMarker   = 'return { agent_uuid: agentUuid, agent_label: label, summary, devices, flows, top_apps };\r\n}';

const startIdx = content.indexOf('  // ── 2. Distinct devices for this agent ─────────────────────────────────────');
const endIdx   = content.indexOf('return { agent_uuid: agentUuid, agent_label: label, summary, devices, flows, top_apps };\r\n}');

if (startIdx === -1) { console.error('START MARKER NOT FOUND'); process.exit(1); }
if (endIdx   === -1) { console.error('END MARKER NOT FOUND'); process.exit(1); }

console.log(`Found start at char ${startIdx}, end at char ${endIdx}`);

const endOffset = endIdx + endMarker.length;

const replacement = `  // ── 2. Distinct devices for this agent ─────────────────────────────────────
  const devRows = d.prepare(\`
    SELECT f.src_ip       AS ip_address,
           f.src_mac      AS mac_address,
           d.device_label,
           d.device_type,
           d.os_label,
           d.manufacturer,
           SUM(f.bytes_download) AS dl,
           SUM(f.bytes_upload)   AS ul,
           MAX(f.last_seen) AS last_seen
    FROM   flows f
    LEFT JOIN (
      SELECT ip_address, device_label, device_type, os_label, manufacturer
      FROM   devices
      GROUP  BY ip_address
    ) d ON d.ip_address = f.src_ip
    WHERE  f.src_mac IN (\${ph})
    GROUP  BY f.src_ip
    ORDER  BY dl DESC
    LIMIT  100
  \`).all(...macs);

  const agentIPs = [...new Set(devRows.map(r => r.ip_address).filter(Boolean))];
  const phIPs    = agentIPs.length > 0 ? agentIPs.map(() => '?').join(',') : null;

  const latestEncAudit = d.prepare(\`SELECT MAX(fetched_at) AS t FROM intel_encryption_audit\`).get()?.t;
  const riskMap = {};
  if (latestEncAudit) {
    const riskRows = d.prepare(\`SELECT ip_address, encrypted_pct, risk_level FROM intel_encryption_audit WHERE fetched_at = ?\`).all(latestEncAudit);
    for (const r of riskRows) {
      if (r.ip_address) riskMap[r.ip_address] = { encrypted_pct: r.encrypted_pct, risk_level: r.risk_level };
    }
  }

  const insecureIPs = new Set(
    phIPs ? d.prepare(\`SELECT DISTINCT ip_address FROM intel_insecure_protocols WHERE ip_address IN (\${phIPs})\`).all(...agentIPs).map(r => r.ip_address) : []
  );

  const devices = devRows.map(r => ({
    ip_address   : r.ip_address,
    mac_address  : r.mac_address,
    device_label : r.device_label || r.ip_address || 'Unknown',
    device_type  : r.device_type  || null,
    os_label     : r.os_label     || null,
    manufacturer : r.manufacturer || null,
    last_seen    : r.last_seen    || null,
    download     : r.dl ?? 0,
    upload       : r.ul ?? 0,
    encrypted_pct: riskMap[r.ip_address]?.encrypted_pct ?? null,
    risk_level   : riskMap[r.ip_address]?.risk_level    ?? null,
    has_insecure : insecureIPs.has(r.ip_address),
  }));

  // ── 3. Recent flows for this agent ─────────────────────────────────────────
  const flowRows = d.prepare(\`
    SELECT src_ip, dst_ip, dst_port, protocol, app_label, domain,
           bytes_download AS download, bytes_upload AS upload, last_seen
    FROM   flows
    WHERE  src_mac IN (\${ph})
    ORDER  BY last_seen DESC
    LIMIT  100
  \`).all(...macs);

  const flows = flowRows.map(r => ({
    src_ip    : r.src_ip,
    dst_ip    : r.dst_ip,
    dst_port  : r.dst_port,
    protocol  : r.protocol,
    app_label : r.app_label,
    domain    : r.domain,
    download  : r.download ?? 0,
    upload    : r.upload   ?? 0,
    last_seen : r.last_seen,
  }));

  // ── 4. Summary stats ────────────────────────────────────────────────────────
  const sumRow = d.prepare(\`
    SELECT COUNT(DISTINCT src_ip) AS device_count,
           COUNT(*) AS flow_count,
           SUM(bytes_download) AS total_download,
           SUM(bytes_upload)   AS total_upload
    FROM   flows
    WHERE  src_mac IN (\${ph})
  \`).get(...macs);

  const summary = sumRow ? {
    total_devices  : sumRow.device_count  ?? 0,
    active_flows   : sumRow.flow_count    ?? 0,
    bandwidth_down : sumRow.total_download ?? 0,
    bandwidth_up   : sumRow.total_upload  ?? 0,
  } : null;

  // ── 5. Security Intel filtered by agent IPs & MACs ─────────────────────────
  const encryptionRows = (latestEncAudit && phIPs)
    ? d.prepare(\`SELECT ip_address, mac_address, device_label, encrypted_pct, unencrypted, encrypted, total, risk_level, detected_at FROM intel_encryption_audit WHERE fetched_at = ? AND ip_address IN (\${phIPs}) ORDER BY CASE risk_level WHEN 'Rawan' THEN 1 WHEN 'Sedang' THEN 2 ELSE 3 END\`).all(latestEncAudit, ...agentIPs)
    : [];

  const insecureProtoRows = phIPs
    ? d.prepare(\`SELECT ip_address, mac_address, protocol, risk, app_label, dst_ip, dst_port, download, upload, detected_at FROM intel_insecure_protocols WHERE ip_address IN (\${phIPs}) ORDER BY detected_at DESC LIMIT 50\`).all(...agentIPs)
    : [];

  let unencPwdRows = d.prepare(\`SELECT ip_address, mac_address, dst_ip, dst_port, protocol, username, severity, download, upload, detected_at FROM intel_unencrypted_passwords WHERE mac_address IN (\${ph}) ORDER BY detected_at DESC LIMIT 50\`).all(...macs);
  if (unencPwdRows.length === 0 && phIPs) {
    unencPwdRows = d.prepare(\`SELECT ip_address, mac_address, dst_ip, dst_port, protocol, username, severity, download, upload, detected_at FROM intel_unencrypted_passwords WHERE ip_address IN (\${phIPs}) ORDER BY detected_at DESC LIMIT 50\`).all(...agentIPs);
  }

  const latestRepSnap = d.prepare(\`SELECT MAX(fetched_at) AS t FROM intel_ip_reputation\`).get()?.t;
  const ipReputRows = (latestRepSnap && phIPs)
    ? d.prepare(\`SELECT ip_address, local_ip, mac_address, reputation, score, country, app_label, blacklisted, download, upload, detected_at FROM intel_ip_reputation WHERE fetched_at = ? AND (local_ip IN (\${phIPs}) OR ip_address IN (\${phIPs})) ORDER BY score DESC LIMIT 50\`).all(latestRepSnap, ...agentIPs, ...agentIPs)
    : [];

  let torRows = d.prepare(\`SELECT ip_address, mac_address, exit_node, circuit_id, country, download, upload, detected_at FROM intel_tor_detection WHERE mac_address IN (\${ph}) ORDER BY detected_at DESC LIMIT 20\`).all(...macs);
  if (torRows.length === 0 && phIPs) {
    torRows = d.prepare(\`SELECT ip_address, mac_address, exit_node, circuit_id, country, download, upload, detected_at FROM intel_tor_detection WHERE ip_address IN (\${phIPs}) ORDER BY detected_at DESC LIMIT 20\`).all(...agentIPs);
  }

  let vpnRows = d.prepare(\`SELECT ip_address, mac_address, vpn_type, remote_ip, protocol, country, confidence, download, upload, detected_at FROM intel_vpn_detection WHERE mac_address IN (\${ph}) ORDER BY detected_at DESC LIMIT 20\`).all(...macs);
  if (vpnRows.length === 0 && phIPs) {
    vpnRows = d.prepare(\`SELECT ip_address, mac_address, vpn_type, remote_ip, protocol, country, confidence, download, upload, detected_at FROM intel_vpn_detection WHERE ip_address IN (\${phIPs}) ORDER BY detected_at DESC LIMIT 20\`).all(...agentIPs);
  }

  const serverDiscRows = phIPs
    ? d.prepare(\`SELECT ip_address, mac_address, server_type, hostname, port, protocol, os_label, download, upload, detected_at FROM intel_server_discovery WHERE ip_address IN (\${phIPs}) ORDER BY detected_at DESC LIMIT 50\`).all(...agentIPs)
    : [];

  const security = {
    encryption_audit     : encryptionRows,
    insecure_protocols   : insecureProtoRows,
    unencrypted_passwords: unencPwdRows,
    ip_reputation        : ipReputRows,
    tor_detections       : torRows,
    vpn_detections       : vpnRows,
  };

  // ── 6. Events filtered by agent IPs & MACs ─────────────────────────────────
  const eventsByIP  = phIPs ? d.prepare(\`SELECT event_id, event_type, severity, ip_address, mac_address, description, event_at FROM events WHERE ip_address IN (\${phIPs}) ORDER BY event_at DESC LIMIT 100\`).all(...agentIPs) : [];
  const eventsByMAC = d.prepare(\`SELECT event_id, event_type, severity, ip_address, mac_address, description, event_at FROM events WHERE mac_address IN (\${ph}) ORDER BY event_at DESC LIMIT 100\`).all(...macs);

  const seenEvt = new Set();
  const allEvents = [];
  for (const r of [...eventsByIP, ...eventsByMAC]) {
    const key = r.event_id || \`\${r.ip_address}:\${r.event_at}\`;
    if (!seenEvt.has(key)) {
      seenEvt.add(key);
      allEvents.push({ event_id: r.event_id, event_type: r.event_type, severity: r.severity, ip_address: r.ip_address, mac_address: r.mac_address, description: r.description, event_at: r.event_at });
    }
  }
  allEvents.sort((a, b) => (b.event_at || '').localeCompare(a.event_at || ''));
  const events = allEvents.slice(0, 100);

  // ── 7. MAC bandwidth for this agent's MACs ──────────────────────────────────
  const latestMacSnap = d.prepare(\`SELECT MAX(fetched_at) AS t FROM mac_bandwidth\`).get()?.t;
  const mac_bandwidth = latestMacSnap
    ? d.prepare(\`SELECT mac_address, manufacturer, download, upload, total FROM mac_bandwidth WHERE fetched_at = ? AND mac_address IN (\${ph}) ORDER BY download DESC\`).all(latestMacSnap, ...macs)
    : [];

  return {
    agent_uuid      : agentUuid,
    agent_label     : label,
    summary,
    devices,
    flows,
    top_apps,
    security,
    events,
    mac_bandwidth,
    server_discovery: serverDiscRows,
  };
}`;

const newContent = content.slice(0, startIdx) + replacement + content.slice(endOffset);
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('SUCCESS: Patched netify.js, new length:', newContent.length);
