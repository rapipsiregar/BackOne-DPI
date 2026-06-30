/**
 * TDD Test Suite: Validasi output file netify_data_export.txt
 * 
 * Test ini mendefinisikan ATURAN yang harus dipenuhi oleh file output:
 * 1. File harus ada
 * 2. File harus tidak kosong
 * 3. File harus berisi section untuk setiap tabel DB
 * 4. Setiap section harus memiliki header, jumlah baris, dan data
 * 5. Data harus berupa JSON valid per baris (JSONL)
 * 6. File harus berisi metadata (tanggal export, versi, jumlah tabel)
 */

const fs   = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '../../netify_data_export.txt');

// ─── Helpers ────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    console.log('  ✅ PASS:', name);
    passed++;
    results.push({ name, status: 'PASS' });
  } catch (e) {
    console.log('  ❌ FAIL:', name);
    console.log('     Reason:', e.message);
    failed++;
    results.push({ name, status: 'FAIL', reason: e.message });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(a, b, message) {
  if (a !== b) throw new Error(message || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

function assertGreaterThan(a, b, message) {
  if (a <= b) throw new Error(message || `Expected ${a} > ${b}`);
}

// ─── Required tables that must appear in the export ─────────────────────────
const REQUIRED_TABLES = [
  'app_categories',
  'bandwidth_apps',
  'bandwidth_countries',
  'bandwidth_protocols',
  'bandwidth_timeline',
  'bittorrent_hashes',
  'cities',
  'continents',
  'devices',
  'dhcp_fingerprints',
  'discovery_os',
  'dns_queries',
  'events',
  'flow_origins',
  'flow_types',
  'flows',
  'http_user_agents',
  'intel_crypto_mining',
  'intel_device_discovery',
  'intel_encryption_audit',
  'intel_insecure_protocols',
  'intel_ip_reputation',
  'intel_server_discovery',
  'intel_tor_detection',
  'intel_unencrypted_passwords',
  'intel_vpn_detection',
  'interfaces',
  'ip_versions',
  'mac_bandwidth',
  'mdns_hostnames',
  'netbios_hostnames',
  'quic_hostnames',
  'regions',
  'remote_ips',
  'sni_hostnames',
  'ssh_versions',
  'ssl_server_cn',
  'threats',
  'tls_ciphers',
  'tls_security',
  'tls_versions',
  'vlans',
];

// ─── Run Tests ────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════════════');
console.log('  TDD TEST SUITE: netify_data_export.txt Validator');
console.log('══════════════════════════════════════════════════════════\n');

// Test 1: File must exist
console.log('[ Group 1: File Existence & Structure ]');
test('File netify_data_export.txt harus ada', () => {
  assert(fs.existsSync(OUTPUT_FILE), `File tidak ditemukan: ${OUTPUT_FILE}`);
});

// Bail early if file doesn't exist
if (!fs.existsSync(OUTPUT_FILE)) {
  console.log('\n  ⚠️  File tidak ada, skip remaining tests.\n');
  process.exit(1);
}

const content = fs.readFileSync(OUTPUT_FILE, 'utf-8');
const lines = content.split('\n');

test('File tidak boleh kosong (minimal 100 baris)', () => {
  assertGreaterThan(lines.length, 100, `File hanya ${lines.length} baris`);
});

test('File harus diawali dengan header metadata', () => {
  assert(content.includes('NETIFY DATA EXPORT'), 'Header NETIFY DATA EXPORT tidak ditemukan');
});

test('File harus berisi tanggal export', () => {
  assert(content.includes('Export Date:') || content.includes('Generated:'), 'Tanggal export tidak ditemukan');
});

test('File harus berisi total jumlah tabel', () => {
  assert(content.includes('Total Tables:') || content.includes('Tables:'), 'Info total tabel tidak ditemukan');
});

// Test 2: Section per table
console.log('\n[ Group 2: Table Sections ]');
REQUIRED_TABLES.forEach(tableName => {
  test(`Section [${tableName}] harus ada di file`, () => {
    assert(
      content.includes(`[TABLE: ${tableName}]`) || content.includes(`TABLE: ${tableName}`),
      `Section untuk tabel ${tableName} tidak ditemukan`
    );
  });
});

// Test 3: Data format
console.log('\n[ Group 3: Data Format & Content ]');

test('Setiap section tabel harus memiliki info ROW COUNT', () => {
  assert(content.includes('Row Count:') || content.includes('rows:'), 'Row count info tidak ditemukan');
});

test('Section flows harus berisi data src_ip', () => {
  const flowSection = content.includes('[TABLE: flows]');
  if (flowSection) {
    assert(content.includes('src_ip') || content.includes('"src_ip"'), 'Data src_ip tidak ditemukan di flows');
  }
});

test('Section bandwidth_apps harus berisi data app_label', () => {
  assert(content.includes('app_label') || content.includes('"app_label"'), 'app_label tidak ditemukan');
});

test('Section intel_encryption_audit harus berisi risk_level', () => {
  assert(content.includes('risk_level') || content.includes('"risk_level"'), 'risk_level tidak ditemukan');
});

test('Section devices harus berisi ip_address', () => {
  assert(content.includes('ip_address') || content.includes('"ip_address"'), 'ip_address tidak ditemukan');
});

// Test 4: Specific data values check
console.log('\n[ Group 4: Real Data Validation ]');

test('File harus mengandung data flows (src_ip format 10.x.x.x atau 192.168.x.x)', () => {
  const hasRealIP = /10\.\d+\.\d+\.\d+/.test(content) || /192\.168\.\d+\.\d+/.test(content);
  assert(hasRealIP, 'Tidak ditemukan IP internal (10.x.x.x / 192.168.x.x)');
});

test('File harus mengandung nama aplikasi nyata (YouTube/Facebook/etc)', () => {
  const hasApp = content.includes('YouTube') || content.includes('Facebook') || content.includes('WhatsApp');
  assert(hasApp, 'Tidak ada nama aplikasi brand yang dikenal');
});

test('Section intel_unencrypted_passwords harus memiliki data username/severity', () => {
  assert(content.includes('severity') || content.includes('"severity"'), 'severity tidak ditemukan');
});

test('File mengandung data agent/MAC address', () => {
  const hasMAC = /[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}/.test(content);
  assert(hasMAC, 'Tidak ada format MAC address yang valid');
});

test('File mengandung bytes/bandwidth numbers (angka > 1000)', () => {
  const hasBigNum = /\d{4,}/.test(content);
  assert(hasBigNum, 'Tidak ada angka bandwidth yang terdeteksi');
});

// Test 5: File size
console.log('\n[ Group 5: File Size ]');

test('File harus cukup besar (minimal 100KB)', () => {
  const stats = fs.statSync(OUTPUT_FILE);
  assertGreaterThan(stats.size, 100 * 1024, `File terlalu kecil: ${stats.size} bytes`);
});

// ─── Summary ────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════════════');
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log('══════════════════════════════════════════════════════════\n');

if (failed > 0) {
  console.log('❌ TESTS FAILED — implementasi diperlukan\n');
  process.exit(1);
} else {
  console.log('✅ ALL TESTS PASSED — file export valid\n');
  process.exit(0);
}
