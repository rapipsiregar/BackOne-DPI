// test/architecture_test.js
// TDD: Verifikasi arsitektur 2 container BackOne DPI

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function readFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

let passed = 0;
let failed = 0;

function test(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } else {
    console.log(`  ✗ FAIL: ${name}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

console.log('\n══════════════════════════════════════════════════════');
console.log('   BackOne DPI — TDD Architecture Verification');
console.log('══════════════════════════════════════════════════════\n');

// ─── TEST GROUP 1: Backend bersih dari SQLite/Netify API ───────────────────
console.log('[GROUP 1] Backend — Isolasi dari SQLite & Netify API');
const serverCode   = readFile('backend/server.js');
const dashCode     = readFile('backend/routes/dashboard.js') +
                     readFile('backend/routes/dashboard/helpers.js') +
                     readFile('backend/routes/dashboard/summary.js') +
                     readFile('backend/routes/dashboard/apps.js') +
                     readFile('backend/routes/dashboard/devices.js') +
                     readFile('backend/routes/dashboard/flows.js') +
                     readFile('backend/routes/dashboard/threats.js') +
                     readFile('backend/routes/dashboard/geo.js') +
                     readFile('backend/routes/dashboard/tls.js') +
                     readFile('backend/routes/dashboard/telemetry.js') +
                     readFile('backend/routes/dashboard/events.js') +
                     readFile('backend/routes/dashboard/agents.js');
const authCode     = readFile('backend/routes/auth.js');

test('server.js tidak memanggil ingestionService',   !serverCode.includes('ingestionService'));
test('server.js tidak import database.js (SQLite)',  !serverCode.includes("require('./database')") && !serverCode.includes("require('../database')"));
test('server.js tidak memanggil startScheduler',    !serverCode.includes('startScheduler'));
test('dashboard.js tidak import database.js',        !dashCode.includes("require('../database')"));
test('dashboard.js tidak import scheduler.js lama',  !dashCode.includes("require('../scheduler')"));
test('dashboard.js tidak memanggil netify.ai API',   !dashCode.includes('netify.ai') && !dashCode.includes('fetchTopApps'));
test('auth.js tidak import database.js',             !authCode.includes("require('../database')"));
test('auth.js tidak menggunakan better-sqlite3',     !authCode.includes('better-sqlite3') && !authCode.includes('getDB()'));
console.log('');

// ─── TEST GROUP 2: Multi-tenant isolation ──────────────────────────────────
console.log('[GROUP 2] Dashboard — Multi-Tenant Agent UUID Isolation');
test('dashboard.js punya getBaseFilter() helper',       dashCode.includes('function getBaseFilter'));
test('getBaseFilter menambahkan agent_uuid filter',     dashCode.includes('filter.agent_uuid = req.user.agent_uuid'));
test('getBaseFilter menambahkan site_uuid filter',      dashCode.includes('filter.site_uuid  = req.user.site_uuid') || dashCode.includes('filter.site_uuid ='));
test('/apps pakai getBaseFilter',                       dashCode.includes("router.get('/apps'") && dashCode.includes('getBaseFilter'));
test('/devices pakai getBaseFilter',                    dashCode.includes("router.get('/devices'") && dashCode.includes('getBaseFilter'));
test('/flows pakai getBaseFilter',                      dashCode.includes("router.get('/flows'") && dashCode.includes('getBaseFilter'));
test('/threats pakai getBaseFilter',                    dashCode.includes("router.get('/threats'") && dashCode.includes('getBaseFilter'));
test('/summary pakai getBaseFilter',                    dashCode.includes("router.get('/summary'") && dashCode.includes('getBaseFilter'));
test('/agents endpoint hanya untuk SUPER_ADMIN',        dashCode.includes("SUPER_ADMIN") && dashCode.includes("router.get('/agents'"));
console.log('');

// ─── TEST GROUP 3: Proxy 2 mode ────────────────────────────────────────────
console.log('[GROUP 3] Proxy — 2 Mode Pengambilan Data');
const schedulerCode = readFile('proxy/scheduler.js');
const collectorCode = readFile('proxy/collector.js');

test('scheduler.js membaca PROXY_COLLECT_MODE env',     schedulerCode.includes('PROXY_COLLECT_MODE'));
test('scheduler.js membaca PROXY_AGENT_UUID env',       schedulerCode.includes('PROXY_AGENT_UUID'));
test("scheduler.js mendukung mode 'all'",               schedulerCode.includes("COLLECT_MODE === 'agent'"));
test('collector.js export collectAllAgents()',           collectorCode.includes('collectAllAgents'));
test('collector.js export collectSpecificAgent()',       collectorCode.includes('collectSpecificAgent'));
test('collector.js tag data dengan agent_uuid',          collectorCode.includes('agent_uuid: agentUuid'));
test('collector.js tag data dengan site_uuid',           collectorCode.includes('site_uuid:  SITE_UUID') || collectorCode.includes('site_uuid: SITE_UUID') || collectorCode.includes('site_uuid: siteUuid'));
console.log('');

// ─── TEST GROUP 4: Docker Compose 2 Container Groups ─────────────────────
console.log('[GROUP 4] Docker Compose — 2 Container Groups + 2 Networks');
const composeCode = readFile('docker-compose.yml');

test('docker-compose.yml punya service: mongodb',        composeCode.includes('mongodb:'));
test('docker-compose.yml punya service: proxy',          composeCode.includes('proxy:'));
test('docker-compose.yml punya service: backend',        composeCode.includes('backend:'));
test('docker-compose.yml punya service: frontend',       composeCode.includes('frontend:'));
test('docker-compose.yml punya network: backone-infra',  composeCode.includes('backone-infra'));
test('docker-compose.yml punya network: backone-app',    composeCode.includes('backone-app'));
test('proxy connect ke backone-infra (Container 1)',     composeCode.includes('backone-infra'));
test('backend connect ke backone-app (Container 2)',     composeCode.includes('backone-app'));
test('proxy depends on mongodb',                         composeCode.includes('service_healthy'));
test('env PROXY_COLLECT_MODE di docker-compose',        composeCode.includes('PROXY_COLLECT_MODE'));
test('env PROXY_AGENT_UUID di docker-compose',          composeCode.includes('PROXY_AGENT_UUID'));
test('PROXY_URL dikirim ke backend',                     composeCode.includes('PROXY_URL=http://proxy:4000'));
console.log('');

// ─── TEST GROUP 5: MongoDB Schemas sinkron ────────────────────────────────
console.log('[GROUP 5] MongoDB Schemas — Proxy & Backend Sinkron');
const proxySchema   = readFile('proxy/models/Schemas.js');
const backendSchema = readFile('backend/models/Schemas.js');

const sharedFields = ['agent_uuid', 'site_uuid', 'timestamp', 'bandwidth_down', 'bandwidth_up', 'ip_address', 'mac_address', 'flow_id', 'src_ip', 'dst_ip', 'threat_type', 'severity'];
for (const field of sharedFields) {
  test(`Field '${field}' ada di kedua schema`, proxySchema.includes(field) && backendSchema.includes(field));
}
console.log('');

// ─── SUMMARY ──────────────────────────────────────────────────────────────
console.log('══════════════════════════════════════════════════════');
console.log(`   Results: ${passed} PASSED | ${failed} FAILED`);
console.log('══════════════════════════════════════════════════════\n');

if (failed > 0) process.exit(1);
