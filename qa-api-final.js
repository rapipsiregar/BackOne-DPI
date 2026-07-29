// qa-api-final.js — Test semua API dengan correct paths
const https = require('https');
const BASE = 'https://dev.demoplace.my.id';
let COOKIES = '';

function req(method, path, body) {
  return new Promise((resolve) => {
    const urlObj = new URL(`${BASE}${path}`);
    const opts = {
      hostname: urlObj.hostname, port: 443,
      path: urlObj.pathname + urlObj.search, method,
      headers: {
        'Content-Type': 'application/json', 'Accept': 'application/json',
        ...(COOKIES ? { 'Cookie': COOKIES } : {}),
        ...(body ? { 'Content-Length': Buffer.byteLength(JSON.stringify(body)) } : {}),
      },
      rejectUnauthorized: false, timeout: 20000,
    };
    const r = https.request(opts, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    r.on('error', e => resolve({ status: 0, body: '', error: e.message }));
    r.on('timeout', () => { r.destroy(); resolve({ status: 0, body: '', error: 'timeout' }); });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

const ic = s => s===200?'✅':s===307||s===302?'🔀':s===401||s===403?'🔒':s===404?'❌':s===500?'💥':'⚠️';

function parsePreview(r) {
  if (!r.body || r.body.length === 0) return '(empty)';
  try {
    const j = JSON.parse(r.body);
    if (Array.isArray(j)) return `Array[${j.length}]`;
    if (j.data && Array.isArray(j.data)) return `{data: Array[${j.data.length}], total: ${j.total||j.data.length}}`;
    return JSON.stringify(j).substring(0, 100);
  } catch(e) { return r.body.substring(0, 80).replace(/\s+/g,' '); }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  API FINAL TEST — dev.demoplace.my.id                ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // Login
  const lr = await req('POST', '/api/auth/login', { username: 'admin', password: 'admin' });
  COOKIES = (lr.headers?.['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
  console.log(`🔐 Login: HTTP ${lr.status} | Cookies: ${COOKIES ? 'YES' : 'NO'}\n`);

  const endpoints = [
    // Auth
    ['GET',  '/api/health',                         'Health check'],
    ['GET',  '/api/auth/me',                        'Auth: me'],
    ['GET',  '/api/auth/users',                     'Auth: users list'],
    ['GET',  '/api/auth/settings',                  'Auth: settings'],
    // Dashboard core
    ['GET',  '/api/dashboard/summary',              'Dashboard: summary'],
    ['GET',  '/api/dashboard/flows?page=1&limit=5', 'Dashboard: flows (p.1)'],
    ['GET',  '/api/dashboard/agents',               'Dashboard: agents'],
    ['GET',  '/api/dashboard/devices?limit=5',      'Dashboard: devices'],
    ['GET',  '/api/dashboard/telemetry?limit=5',    'Dashboard: telemetry'],
    ['GET',  '/api/dashboard/threats?limit=5',      'Dashboard: threats'],
    ['GET',  '/api/dashboard/events?limit=5',       'Dashboard: events'],
    ['GET',  '/api/dashboard/geo',                  'Dashboard: geo'],
    ['GET',  '/api/dashboard/apps?limit=5',         'Dashboard: apps'],
    ['GET',  '/api/dashboard/device-labeling',      'Dashboard: device-labeling'],
    ['GET',  '/api/dashboard/flow-stats',           'Dashboard: flow-stats'],
    ['GET',  '/api/dashboard/tls?limit=5',          'Dashboard: TLS'],
    ['GET',  '/api/dashboard/agent-locations',      'Dashboard: agent-locations'],
    ['GET',  '/api/dashboard/blacklist',            'Dashboard: blacklist'],
    // Details
    ['GET',  '/api/dashboard/metadata-detail',      'Metadata detail'],
    ['GET',  '/api/dashboard/category-detail',      'Category detail'],
  ];

  for (const [method, path, label] of endpoints) {
    const r = await req(method, path);
    const isJson = r.headers?.['content-type']?.includes('json');
    const preview = parsePreview(r);
    console.log(`  ${ic(r.status)} [${method}] ${label.padEnd(32)} HTTP ${r.status} | ${r.body?.length||0}b | ${preview.substring(0,80)}`);
  }

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  API TEST SELESAI                                    ║');
  console.log('╚══════════════════════════════════════════════════════╝');
}
main().catch(console.error);
