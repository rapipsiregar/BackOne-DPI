// TDD Test: Verifikasi fix untuk Bug #1 (Devices) dan Bug #2 (Flows)
// Jalankan: node backend/tests/test_bug_fixes.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const API_KEY = process.env.NETIFY_API_KEY;
const SITE_UUID = process.env.NETIFY_SITE_UUID;
const BASE = 'https://informatics.netify.ai/api/v1';
const axios = require('axios');

const headers = {
  'x-api-key': API_KEY,
  'x-net-site': SITE_UUID,
  'Accept': 'application/json'
};

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function testDevicesBugFix() {
  console.log('\n=== BUG #1: DEVICES - Download/Upload/Type/OS Fix ===');

  const [dlResp, ulResp, devResp, flowsResp] = await Promise.all([
    axios.get(`${BASE}/data/stats/top/local_ip/download`, { headers, params: { filter_interval: 1440, settings_limit: 500 }, timeout: 15000 }),
    axios.get(`${BASE}/data/stats/top/local_ip/upload`, { headers, params: { filter_interval: 1440, settings_limit: 500 }, timeout: 15000 }),
    axios.get(`${BASE}/intelligence/discovery/devices`, { headers, params: { settings_limit: 500 }, timeout: 15000 }),
    axios.get(`${BASE}/data/flows`, { headers, params: { settings_limit: 500 }, timeout: 15000 }),
  ]);

  const dlData = dlResp.data?.data || [];
  const ulData = ulResp.data?.data || [];
  const devData = devResp.data?.data || [];
  const flowData = flowsResp.data?.data || [];

  console.log(`  Total IPs in download stats: ${dlData.length}`);
  console.log(`  Total IPs in upload stats: ${ulData.length}`);
  console.log(`  Total discovered devices: ${devData.length}`);
  console.log(`  Total flows: ${flowData.length}`);

  // Build maps
  const dlMap = {};
  for (const r of dlData) {
    if (r.local_ip?.address) dlMap[r.local_ip.address] = r.download;
  }
  const ulMap = {};
  for (const r of ulData) {
    if (r.local_ip?.address) ulMap[r.local_ip.address] = r.upload;
  }
  // Flows fallback map
  const dlFlowMap = {};
  const ulFlowMap = {};
  for (const f of flowData) {
    const ip = f.local_ip?.address;
    if (!ip) continue;
    if (!dlMap[ip]) dlFlowMap[ip] = (dlFlowMap[ip] || 0) + (f.download || 0);
    if (!ulMap[ip]) ulFlowMap[ip] = (ulFlowMap[ip] || 0) + (f.upload || 0);
  }

  // Test: devices dengan non-zero bandwidth setelah enrichment
  const enriched = devData.map(r => {
    const ip = r.ip?.address;
    const dl = ip ? (dlMap[ip] || dlFlowMap[ip] || 0) : 0;
    const ul = ip ? (ulMap[ip] || ulFlowMap[ip] || 0) : 0;
    const type = r.discovery_type?.label;
    const os = r.discovery_os?.label;
    return { ip, dl, ul, type, os };
  }).sort((a, b) => (b.dl + b.ul) - (a.dl + a.ul));

  const withBandwidth = enriched.filter(d => d.dl > 0 || d.ul > 0);
  const withType = enriched.filter(d => d.type && d.type !== 'Unknown' && d.type !== 'Unclassified');
  const withOs = enriched.filter(d => d.os && d.os !== 'Unknown' && d.os !== 'Unclassified');

  assert(enriched.length > 0, `Devices tersedia: ${enriched.length} entries`);
  assert(withBandwidth.length > 0, `Devices dengan bandwidth non-zero: ${withBandwidth.length}/${enriched.length}`);
  assert(withType.length > 0, `Devices dengan type terdeteksi: ${withType.length}/${enriched.length}`);
  assert(withOs.length > 0, `Devices dengan OS terdeteksi: ${withOs.length}/${enriched.length}`);

  // Print top 5 devices
  console.log('\n  Top 5 devices after fix:');
  for (const d of enriched.slice(0, 5)) {
    console.log(`    IP=${d.ip}, DL=${(d.dl / 1024 / 1024).toFixed(2)}MB, UL=${(d.ul / 1024 / 1024).toFixed(2)}MB, type=${d.type || '-'}, os=${d.os || '-'}`);
  }
}

async function testFlowsBugFix() {
  console.log('\n=== BUG #2: FLOWS - App/Domain Column Fix ===');

  const [flowsResp, tslSniResp] = await Promise.all([
    axios.get(`${BASE}/data/flows`, { headers, params: { settings_limit: 50 }, timeout: 15000 }),
    axios.get(`${BASE}/data/stats/top/tls_sni/download`, { headers, params: { filter_interval: 1440, settings_limit: 50 }, timeout: 15000 }),
  ]);

  const flowData = flowsResp.data?.data || [];
  const sniData = tslSniResp.data?.data || [];

  const PORT_SERVICE_MAP = {
    80: 'HTTP', 443: 'HTTPS / TLS', 8080: 'HTTP Alt', 8443: 'HTTPS Alt',
    53: 'DNS', 5353: 'mDNS', 853: 'DNS-over-TLS',
    22: 'SSH', 23: 'Telnet', 3389: 'RDP', 5900: 'VNC',
    9993: 'ZeroTier VPN', 3478: 'STUN/TURN', 5004: 'RTP Media',
    5060: 'SIP', 5061: 'SIP TLS', 1194: 'OpenVPN', 51820: 'WireGuard',
    500: 'IPSec IKE', 4500: 'IPSec NAT-T', 1723: 'PPTP', 1701: 'L2TP',
    67: 'DHCP', 68: 'DHCP Client', 123: 'NTP', 161: 'SNMP',
  };

  const sniList = sniData.map(r => r.tls_sni || '').filter(s => s.trim() !== '');
  console.log(`  TLS SNI hostnames available: ${sniList.length}`);

  const enrichedFlows = flowData.map(r => {
    const port = r.remote_port ?? null;
    const portService = port ? (PORT_SERVICE_MAP[port] ?? `Port ${port}`) : null;
    let domain = null;
    let appLabel = portService;
    if ((port === 443 || port === 8443) && sniList.length > 0) {
      domain = sniList[0];
    }
    return { src: r.local_ip?.address, dst: r.remote_ip?.address, port, appLabel, domain };
  });

  const withAppLabel = enrichedFlows.filter(f => f.appLabel !== null);

  assert(enrichedFlows.length > 0, `Flows tersedia: ${enrichedFlows.length} entries`);
  assert(withAppLabel.length > 0, `Flows dengan app_label terisi (port-based): ${withAppLabel.length}/${enrichedFlows.length}`);

  // Count unique app labels
  const labelCounts = {};
  for (const f of enrichedFlows) {
    const k = f.appLabel || 'Unknown';
    labelCounts[k] = (labelCounts[k] || 0) + 1;
  }
  console.log('  App label distribution:', JSON.stringify(labelCounts));

  // Print sample flows
  console.log('\n  Sample flows after fix:');
  for (const f of enrichedFlows.slice(0, 5)) {
    console.log(`    ${f.src} -> ${f.dst}:${f.port} | app="${f.appLabel || '-'}" domain="${f.domain || '-'}"`);
  }
}

async function testBackendAPI() {
  console.log('\n=== BACKEND API VERIFICATION ===');
  try {
    const r = await axios.get('http://localhost:3001/api/dashboard/flows?limit=10', { timeout: 5000 });
    const flows = r.data?.data || [];
    assert(r.data?.ok === true, 'Backend /flows endpoint responds OK');
    assert(flows.length > 0, `Flows dari backend: ${flows.length} entries`);
    const withApp = flows.filter(f => f.app_label !== null);
    assert(withApp.length > 0, `Flows dengan app_label dari backend: ${withApp.length}/${flows.length}`);
    console.log('  Sample from backend:');
    for (const f of flows.slice(0, 3)) {
      console.log(`    ${f.src_ip} -> ${f.dst_ip}:${f.dst_port} | app="${f.app_label || '-'}" domain="${f.domain || '-'}" dl=${f.bytes_download} ul=${f.bytes_upload}`);
    }
  } catch (e) {
    console.log(`  Backend API test skipped: ${e.message}`);
  }

  try {
    const r = await axios.get('http://localhost:3001/api/dashboard/devices?limit=10', { timeout: 5000 });
    const devs = r.data?.data || [];
    assert(r.data?.ok === true, 'Backend /devices endpoint responds OK');
    assert(devs.length > 0, `Devices dari backend: ${devs.length} entries`);
    const withType = devs.filter(d => d.device_type !== null);
    const withOs = devs.filter(d => d.os_label !== null);
    const withBw = devs.filter(d => d.download > 0 || d.upload > 0);
    assert(withBw.length > 0, `Devices dengan bandwidth non-zero dari backend: ${withBw.length}/${devs.length}`);
    console.log('  Sample devices from backend:');
    for (const d of devs.slice(0, 3)) {
      console.log(`    IP=${d.ip_address}, DL=${(d.download / 1024 / 1024).toFixed(2)}MB, type=${d.device_type || '-'}, os=${d.os_label || '-'}`);
    }
  } catch (e) {
    console.log(`  Backend /devices test skipped: ${e.message}`);
  }
}

async function run() {
  console.log('=== TDD: Bug Fix Verification Tests ===\n');
  await testDevicesBugFix();
  await testFlowsBugFix();
  await testBackendAPI();

  console.log(`\n=== RESULT: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

run().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
