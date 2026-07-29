// qa-audit.js — Komprehensif QA audit semua halaman & API endpoint production
const https = require('https');
const http = require('http');

const BASE = 'https://dev.demoplace.my.id';
const BACKEND = 'http://103.185.47.52'; // test via external

// Cookies dari login untuk test authenticated pages
let COOKIES = '';

function req(method, url, body, cookies) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https');
    const lib = isHttps ? https : http;
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/html,application/json,*/*',
        ...(cookies ? { 'Cookie': cookies } : {}),
        ...(body ? { 'Content-Length': Buffer.byteLength(JSON.stringify(body)) } : {}),
      },
      rejectUnauthorized: false,
      timeout: 15000,
    };
    const r = lib.request(options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: data,
        size: data.length,
      }));
    });
    r.on('error', e => resolve({ status: 0, error: e.message, body: '', size: 0 }));
    r.on('timeout', () => { r.destroy(); resolve({ status: 0, error: 'timeout', body: '', size: 0 }); });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function icon(status) {
  if (status === 200) return '✅';
  if (status === 307 || status === 301 || status === 302) return '🔀';
  if (status === 401 || status === 403) return '🔒';
  if (status === 404) return '❌';
  if (status === 500) return '💥';
  if (status === 0) return '⛔';
  return '⚠️';
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  QA AUDIT — dev.demoplace.my.id                      ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // --- STEP 1: Login & get session cookie ---
  console.log('🔐 STEP 1: Login dengan admin/admin...');
  const loginRes = await req('POST', `${BASE}/api/auth/login`, { username: 'admin', password: 'admin' });
  console.log(`   HTTP ${loginRes.status} | Size: ${loginRes.size}b`);
  if (loginRes.status === 200) {
    const setCookie = loginRes.headers['set-cookie'];
    if (setCookie) {
      COOKIES = setCookie.map(c => c.split(';')[0]).join('; ');
      console.log(`   ✅ Cookie diterima: ${COOKIES.substring(0, 60)}...`);
    }
    console.log(`   User: ${loginRes.body.substring(0, 100)}`);
  } else {
    console.log(`   ❌ Login gagal: ${loginRes.body.substring(0, 100)}`);
  }

  // --- STEP 2: Unauthenticated pages ---
  console.log('\n📄 STEP 2: Public pages (unauthenticated)...');
  const publicPages = [
    ['/', 'Root (redirect check)'],
    ['/login', 'Login page'],
  ];
  for (const [path, label] of publicPages) {
    const r = await req('GET', `${BASE}${path}`);
    const isHtml = r.body.includes('<!DOCTYPE') || r.body.includes('<html');
    console.log(`   ${icon(r.status)} ${label}: HTTP ${r.status} | HTML: ${isHtml} | ${r.size}b | Location: ${r.headers?.location || '-'}`);
  }

  // --- STEP 3: Authenticated pages ---
  console.log('\n🏠 STEP 3: Dashboard pages (authenticated)...');
  const dashPages = [
    ['/dashboard', 'Dashboard main'],
    ['/dashboard/flows', 'Flows table'],
    ['/dashboard/telemetry', 'Telemetry'],
    ['/dashboard/devices', 'Device labeling'],
    ['/dashboard/agents', 'Network agents'],
    ['/dashboard/users', 'User management'],
    ['/dashboard/settings', 'Settings'],
    ['/dashboard/profile', 'Profile'],
  ];
  for (const [path, label] of dashPages) {
    const r = await req('GET', `${BASE}${path}`, null, COOKIES);
    const isHtml = r.body.includes('<!DOCTYPE') || r.body.includes('<html');
    const hasError = r.body.includes('error') || r.body.includes('Error');
    console.log(`   ${icon(r.status)} ${label}: HTTP ${r.status} | HTML: ${isHtml} | Error: ${hasError} | ${r.size}b`);
  }

  // --- STEP 4: API endpoints ---
  console.log('\n🔌 STEP 4: API endpoints...');
  const apiEndpoints = [
    ['GET', '/api/health', 'Health check', null],
    ['GET', '/api/auth/me', 'Auth me', null],
    ['GET', '/api/flows?page=1&limit=10', 'Flows (paged)', null],
    ['GET', '/api/telemetry', 'Telemetry data', null],
    ['GET', '/api/devices', 'Devices list', null],
    ['GET', '/api/agents', 'Network agents', null],
    ['GET', '/api/users', 'Users list (admin)', null],
    ['GET', '/api/dashboard/stats', 'Dashboard stats', null],
    ['GET', '/api/dashboard/summary', 'Dashboard summary', null],
  ];
  for (const [method, path, label] of apiEndpoints) {
    const r = await req(method, `${BASE}${path}`, null, COOKIES);
    const isJson = r.headers?.['content-type']?.includes('json');
    const preview = r.body.replace(/\s+/g, ' ').substring(0, 80);
    console.log(`   ${icon(r.status)} [${method}] ${label}: HTTP ${r.status} | JSON: ${isJson} | ${r.size}b`);
    if (r.status !== 200) console.log(`      └─ ${preview}`);
  }

  // --- STEP 5: Static assets ---
  console.log('\n🎨 STEP 5: Static assets...');
  const assets = [
    ['/backone-logo.png', 'Logo PNG'],
    ['/favicon.ico', 'Favicon'],
    ['/_next/static/chunks/1e--nra3xanpi.css', 'CSS chunk 1'],
    ['/_next/static/media/BackOneLogo_Regular-s.p.27fxep_pjgchi.ttf', 'Custom font'],
  ];
  for (const [path, label] of assets) {
    const r = await req('GET', `${BASE}${path}`);
    console.log(`   ${icon(r.status)} ${label}: HTTP ${r.status} | CT: ${r.headers?.['content-type']?.split(';')[0] || '-'} | ${r.size}b`);
  }

  // --- STEP 6: Login with all accounts ---
  console.log('\n👤 STEP 6: Test semua akun...');
  const accounts = [
    ['admin', 'admin', 'SUPER_ADMIN'],
    ['siab', 'siab', 'TENANT_ADMIN (SIAB)'],
    ['office', 'office', 'TENANT_ADMIN (Office)'],
  ];
  for (const [user, pass, role] of accounts) {
    const r = await req('POST', `${BASE}/api/auth/login`, { username: user, password: pass });
    if (r.status === 200) {
      const data = JSON.parse(r.body);
      console.log(`   ✅ ${user}/${pass} → ${data.user?.account_name || role} (${data.user?.role})`);
    } else {
      console.log(`   ❌ ${user}/${pass} → HTTP ${r.status}: ${r.body.substring(0, 60)}`);
    }
  }

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  QA AUDIT SELESAI                                    ║');
  console.log('╚══════════════════════════════════════════════════════╝');
}

main().catch(console.error);
