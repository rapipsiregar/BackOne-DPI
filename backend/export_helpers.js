/**
 * backend/export_helpers.js
 * Helper formatting and table metadata for generate_export.js
 */

function fmtBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let b = Math.abs(bytes);
  let i = 0;
  while (b >= 1024 && i < units.length - 1) { b /= 1024; i++; }
  return b.toFixed(2) + ' ' + units[i];
}

function fmtNum(n) {
  if (n == null) return 'N/A';
  return Number(n).toLocaleString('id-ID');
}

function separator(char = '═', len = 80) {
  return char.repeat(len);
}

function sectionHeader(tableName, rowCount, description) {
  return [
    '',
    separator('═'),
    `[TABLE: ${tableName}]`,
    `Row Count: ${fmtNum(rowCount)}`,
    description ? `Description: ${description}` : '',
    separator('─'),
  ].filter(l => l !== '').join('\n');
}

const TABLE_DESCRIPTIONS = {
  bandwidth_apps       : 'Bandwidth per aplikasi (YouTube, Facebook, dll) dari BackOne DPI',
  bandwidth_timeline   : 'Timeline bandwidth per menit (download/upload historis)',
  bittorrent_info_hashes: 'Deteksi aktivitas BitTorrent berdasarkan info hash',
  countries            : 'Distribusi traffic berdasarkan negara tujuan',
  devices              : 'Daftar perangkat (IP/MAC) beserta bandwidth & OS',
  dhcp_fingerprints    : 'Fingerprint DHCP untuk identifikasi tipe device',
  discovered_os        : 'OS yang terdeteksi dari traffic scanning',
  dns_stats            : 'Query DNS teratas dan statistik resolusi domain',
  events               : 'Event log dari BackOne agent (koneksi, peringatan, dll)',
  flows                : 'Data aliran jaringan per-sesi (src IP, dst IP, aplikasi, domain, bytes)',
  flow_origins         : 'Asal flow: lokal (LAN) atau eksternal (WAN)',
  flow_types           : 'Tipe flow: TCP, UDP, ICMP, dll',
  http_user_agents     : 'HTTP User-Agent yang terdeteksi (browser, OS, framework)',
  intel_crypto_mining  : 'Deteksi aktivitas crypto mining (pool host, protokol)',
  intel_device_discovery: 'Penemuan perangkat baru di jaringan (tipe, OS, manufaktur)',
  intel_encryption_audit: 'Audit enkripsi traffic per perangkat (encrypted%, risk level)',
  intel_insecure_protocols: 'Protokol tidak aman yang terdeteksi (HTTP, Telnet, FTP, dll)',
  intel_ip_reputation  : 'Reputasi IP eksternal (blacklist, threat score)',
  intel_server_discovery: 'Server yang terdeteksi (HTTPS, SSH, HTTP, dll)',
  intel_tor_detection  : 'Deteksi penggunaan jaringan Tor',
  intel_unencrypted_passwords: 'Deteksi pengiriman password dalam bentuk plaintext',
  intel_vpn_detection  : 'Deteksi penggunaan VPN (OpenVPN, WireGuard, dll)',
  interfaces           : 'Interface jaringan per agent (WAN/LAN, bandwidth)',
  ip_versions          : 'Distribusi traffic IPv4 vs IPv6',
  mac_bandwidth        : 'Bandwidth per MAC address perangkat',
  mdns_hostnames       : 'mDNS hostname yang terdeteksi di jaringan lokal',
  netbios_hostnames    : 'NetBIOS hostname (nama komputer Windows)',
  protocols            : 'Distribusi protokol jaringan (port usage)',
  quic_hostnames       : 'Hostname via QUIC/HTTP3 (Google, Cloudflare, dll)',
  regions              : 'Distribusi traffic berdasarkan region/kota tujuan',
  remote_ips           : 'IP remote teratas yang diakses perangkat',
  sni_hostnames        : 'Server Name Indication dari koneksi TLS',
  ssh_versions         : 'Versi SSH yang terdeteksi di jaringan',
  ssl_server_cn        : 'Common Name sertifikat SSL server',
  threats              : 'Ancaman keamanan terdeteksi (threat alerts)',
  tls_ciphers          : 'Cipher suite TLS yang digunakan',
  tls_security         : 'Tingkat keamanan TLS (Modern, Compatible, Old)',
  tls_versions         : 'Versi TLS yang digunakan (1.0, 1.2, 1.3)',
  vlans                : 'VLAN yang terdeteksi di jaringan',
};

module.exports = {
  fmtBytes,
  fmtNum,
  separator,
  sectionHeader,
  TABLE_DESCRIPTIONS,
};
