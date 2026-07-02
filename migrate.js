const Database = require('better-sqlite3');
const path = require('path');
const DB_PATH = path.join('d:/FILE/Magang/Deep Package Inspection/backend/netify_data.db');

const db = new Database(DB_PATH);
const tables = [
  'bandwidth_apps', 'bandwidth_protocols', 'bandwidth_countries', 'dns_queries', 'events', 
  'bandwidth_timeline', 'threats', 'devices', 'flows', 'tls_versions', 'tls_ciphers', 
  'tls_security', 'netbios_hostnames', 'dhcp_fingerprints', 'http_user_agents', 'sni_hostnames', 
  'ssl_server_cn', 'quic_hostnames', 'bittorrent_hashes', 'ssh_versions', 'mdns_hostnames', 
  'intel_crypto_mining', 'intel_device_discovery', 'intel_encryption_audit', 'intel_insecure_protocols', 
  'intel_ip_reputation', 'intel_server_discovery', 'intel_tor_detection', 'intel_unencrypted_passwords', 
  'intel_vpn_detection', 'app_categories', 'continents', 'regions', 'cities', 'vlans', 
  'interfaces', 'flow_types', 'flow_origins', 'ip_versions', 'remote_ips', 'mac_bandwidth', 'discovery_os'
];

let success = 0;
for (const t of tables) {
  try {
    db.exec(`ALTER TABLE ${t} ADD COLUMN agent_uuid TEXT DEFAULT NULL`);
    success++;
  } catch (e) {
    if (!e.message.includes('duplicate column name')) {
      console.log(`Failed to alter ${t}:`, e.message);
    }
  }
}
console.log(`Migration complete! Successfully altered ${success} tables.`);
db.close();
