// qa-audit-v2.js — QA audit dengan correct route paths
const https = require('https');

const BASE = 'https://dev.demoplace.my.id';
let COOKIES = '';

function req(method, path, body) {
  return new Promise((resolve) => {
    const urlObj = new URL(`${BASE}${path}`);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/html,application/json,*/*',
        ...(COOKIES ? { 'Cookie': COOKIES } : {}),
        ...(body ? { 'Content-Length': Buffer.byteLength(JSON.stringify(body)) } : {}),
      },
      rejectUnauthorized: false,
      timeout: 15000,
    };
    const r = https.request(options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    r.on('error', e => resolve({ status: 0, error: e.message, body: '' }));
    r.on('timeout', () => { r.destroy(); resolve({ status: 0, error: 'timeout', body: '' }); });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

const ic = (s) => s===200?'✅':s===307||s===302||s===301?'🔀':s===401||s===403?'🔒':s===404?'❌':s===500?'💥':'⚠️';

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  QA AUDIT v2 — dev.demoplace.my.id (correct routes)      ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Login
  const lr = await req('POST', '/api/auth/login', { username: 'admin', password: 'admin' });
  if (lr.headers?.['set-cookie']) {
    COOKIES = lr.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
    console.log(`✅ Login OK | Cookie: ${COOKIES.substring(0,50)}...\n`);
  }

  // Dashboard pages — correct paths
  console.log('🏠 DASHBOARD PAGES (correct route paths):');
  const pages = [
    ['/', 'Root (after auth)'],
    ['/flows', 'Flows table'],
    ['/agents', 'Network Agents'],
    ['/device-labeling', 'Device Labeling'],
    ['/devices', 'Devices'],
    ['/dpi-analytics', 'DPI Analytics'],
    ['/flows', 'Flows'],
    ['/geography', 'Geography'],
    ['/intelligence', 'Intelligence'],
    ['/network-infrastructure', 'Network Infrastructure'],
    ['/network-intelligence', 'Network Intelligence'],
    ['/security-audit', 'Security Audit'],
    ['/threats', 'Threats'],
    ['/events', 'Events'],
    ['/dns', 'DNS'],
    ['/lookup', 'Lookup'],
    ['/apps', 'Applications'],
    ['/user-accounts', 'User Accounts'],
    ['/help', 'Help'],
  ];
  for (const [path, label] of pages) {
    const r = await req('GET', path);
    const isHtml = r.body?.startsWith('<!DOCTYPE') || r.body?.includes('<html');
    const hasData = r.body?.includes('BackOne') || r.body?.includes('dashboard') || r.body?.includes('flows');
    const loc = r.headers?.location || '-';
    console.log(`  ${ic(r.status)} ${label.padEnd(28)} HTTP ${r.status} | HTML:${isHtml?'Y':'N'} | Data:${hasData?'Y':'N'} | ${r.body?.length||0}b ${loc !== '-' ? `→ ${loc}` : ''}`);
  }

  // API endpoints
  console.log('\n🔌 API ENDPOINTS:');
  const apis = [
    ['GET', '/api/health', 'Health'],
    ['GET', '/api/auth/me', 'Auth/me'],
    ['GET', '/api/dashboard/summary', 'Dashboard summary'],
    ['GET', '/api/dashboard/stats', 'Dashboard stats'],
    ['GET', '/api/flows?page=1&limit=5', 'Flows list'],
    ['GET', '/api/telemetry?limit=5', 'Telemetry'],
    ['GET', '/api/agents', 'Agents'],
    ['GET', '/api/devices?limit=5', 'Devices'],
    ['GET', '/api/users', 'Users'],
    ['GET', '/api/sites', 'Sites'],
  ];
  for (const [method, path, label] of apis) {
    const r = await req(method, path);
    const isJson = r.headers?.['content-type']?.includes('json');
    let preview = '';
    if (r.status !== 200) preview = ` | ${r.body?.substring(0, 60).replace(/\s+/g,' ')}`;
    else if (isJson) {
      try { const j = JSON.parse(r.body); preview = ` | keys: ${Object.keys(j).join(', ')}`; } catch(e){}
    }
    console.log(`  ${ic(r.status)} [${method}] ${label.padEnd(20)} HTTP ${r.status} | JSON:${isJson?'Y':'N'} | ${r.body?.length||0}b${preview.substring(0,80)}`);
  }

  // All accounts
  console.log('\n👤 ALL ACCOUNTS:');
  const accounts = [['admin','admin'],['siab','siab'],['office','office']];
  for (const [u, p] of accounts) {
    const r = await req('POST', '/api/auth/login', { username: u, password: p });
    if (r.status === 200) {
      const d = JSON.parse(r.body);
      console.log(`  ✅ ${u}/${p} → ${d.user?.account_name} (${d.user?.role}) | site: ${d.user?.site_uuid?.substring(0,8)}...`);
    } else {
      console.log(`  ❌ ${u}/${p} → HTTP ${r.status}: ${r.body?.substring(0,60)}`);
    }
  }

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  AUDIT SELESAI                                           ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
}
main().catch(console.error);
