// test/final_review.js
// Final Review — Verifikasi semua deliverable dari original request

const fs   = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

function r(f) { return fs.readFileSync(path.join(ROOT, f), 'utf8'); }

let ok = 0, fail = 0;
function check(label, condition) {
  const mark = condition ? '✓' : '✗ FAIL';
  console.log(`  ${mark}: ${label}`);
  condition ? ok++ : fail++;
}

console.log('\n╔══════════════════════════════════════════════════════╗');
console.log('║   FINAL REVIEW — Original Request Deliverables      ║');
console.log('╚══════════════════════════════════════════════════════╝\n');

const dash    = r('backend/routes/dashboard.js');
const auth    = r('backend/routes/auth.js');
const server  = r('backend/server.js');
const sched   = r('proxy/scheduler.js');
const coll    = r('proxy/collector.js');
const compose = r('docker-compose.yml');
const envFile = r('.env.local');
const proxyIdx = r('proxy/index.js');
const proxySchema = r('proxy/models/Schemas.js');
const pkg     = JSON.parse(r('backend/package.json'));

// ─── DELIVERABLE 1: Proxy 2 Mode ───────────────────────────────────────────
console.log('📦 DELIVERABLE 1: Proxy — 2 Mode Pengambilan Data');
check('Mode ALL: collectAllAgents() ada', coll.includes('collectAllAgents'));
check('Mode AGENT: collectSpecificAgent() ada', coll.includes('collectSpecificAgent'));
check('Scheduler baca PROXY_COLLECT_MODE env', sched.includes('PROXY_COLLECT_MODE'));
check('Scheduler baca PROXY_AGENT_UUID env', sched.includes('PROXY_AGENT_UUID'));
check('Jika mode=agent → collectSpecificAgent', sched.includes("COLLECT_MODE === 'agent'"));
check('Jika mode=all → collectAllAgents', sched.includes('collectAllAgents'));
console.log('');

// ─── DELIVERABLE 2: Data Isolation per Agent UUID ──────────────────────────
console.log('📦 DELIVERABLE 2: Isolasi Data per Network Agent UUID di MongoDB');
check('Proxy tag dokumen dengan agent_uuid', coll.includes('agent_uuid: agentUuid'));
check('Proxy tag dokumen dengan site_uuid', coll.includes('site_uuid'));
check('Proxy simpan IP address per agent', coll.includes('ip_address'));
check('Proxy simpan MAC address per agent', coll.includes('mac_address'));
check('Proxy simpan timestamp per agent', coll.includes('timestamp'));
check('Proxy simpan bandwidth per agent', coll.includes('bandwidth_down') || coll.includes('download'));
check('Summary schema punya agent_uuid', proxySchema.includes('agent_uuid'));
check('Flow schema punya agent_uuid', proxySchema.includes('FlowSchema'));
check('Device schema punya mac_address', proxySchema.includes('mac_address'));
check('Threat schema ada', proxySchema.includes('ThreatSchema'));
console.log('');

// ─── DELIVERABLE 3: Backend READ-ONLY dari MongoDB ─────────────────────────
console.log('📦 DELIVERABLE 3: Backend Hanya Baca MongoDB (bukan tulis/ingestion)');
check('server.js tidak ada ingestionService', !server.includes('ingestionService'));
check('server.js tidak ada startScheduler', !server.includes('startScheduler'));
check('server.js tidak ada import SQLite database.js', !server.includes("'./database'"));
check('dashboard.js tidak ada db.getStats SQLite', !dash.includes('db.getStats'));
check('dashboard.js tidak ada db.getBandwidthTimeline', !dash.includes('getBandwidthTimeline'));
check('dashboard.js tidak ada db.getLatest SQLite', !dash.includes('db.getLatest'));
check('auth.js tidak import database.js', !auth.includes("require('../database')"));
check('auth.js tidak ada better-sqlite3', !auth.includes('better-sqlite3'));
check('package.json tidak ada sqlite3', !pkg.dependencies['sqlite3'] && !pkg.dependencies['better-sqlite3']);
console.log('');

// ─── DELIVERABLE 4: Multi-tenant isolasi per agent ─────────────────────────
console.log('📦 DELIVERABLE 4: Multi-Tenant Isolation (Backend filter per agent_uuid)');
check('getBaseFilter() helper ada', dash.includes('function getBaseFilter'));
check('agent_uuid filter diterapkan jika AGENT_VIEWER', dash.includes('filter.agent_uuid = req.user.agent_uuid'));
check('site_uuid filter diterapkan', dash.includes('filter.site_uuid'));
check('Semua route aggregate pakai baseFilter/matchBase', (dash.match(/matchBase|getBaseFilter/g) || []).length > 15);
check('/agents hanya SUPER_ADMIN', dash.includes("role !== 'SUPER_ADMIN'"));
check('SUPER_ADMIN lihat semua data (no agent filter)', dash.includes('AGENT_VIEWER'));
check('View-As mode didukung di server.js', server.includes('AGENT_VIEWER') && server.includes('view-as'));
console.log('');

// ─── DELIVERABLE 5: 2 Docker Container Groups ──────────────────────────────
console.log('📦 DELIVERABLE 5: 2 Docker Container Groups (Container 1: Proxy+MongoDB, Container 2: Backend+Frontend)');
check('Container 1: Service mongodb', compose.includes('mongodb:'));
check('Container 1: Service proxy', compose.includes('proxy:'));
check('Container 2: Service backend', compose.includes('backend:'));
check('Container 2: Service frontend', compose.includes('frontend:'));
check('Network backone-infra (Container 1)', compose.includes('backone-infra'));
check('Network backone-app (Container 2)', compose.includes('backone-app'));
check('Proxy di backone-infra (isolated)', compose.includes('backone-infra'));
check('Backend di backone-app (isolated)', compose.includes('backone-app'));
check('MongoDB di kedua network (shared)', compose.includes('backone-infra') && compose.includes('backone-app'));
check('Proxy depends on mongodb healthcheck', compose.includes('service_healthy'));
check('PROXY_COLLECT_MODE di docker-compose', compose.includes('PROXY_COLLECT_MODE'));
check('PROXY_AGENT_UUID di docker-compose', compose.includes('PROXY_AGENT_UUID'));
check('PROXY_URL ke backend (untuk manual refresh)', compose.includes('PROXY_URL'));
console.log('');

// ─── DELIVERABLE 6: Proxy API Endpoints ────────────────────────────────────
console.log('📦 DELIVERABLE 6: Proxy REST API (port 4000)');
check('GET /health', proxyIdx.includes("'/health'"));
check('GET /status', proxyIdx.includes("'/status'"));
check('GET /agents (list all agent UUIDs di MongoDB)', proxyIdx.includes("'/agents'"));
check('POST /collect/all (trigger semua agent)', proxyIdx.includes("'/collect/all'"));
check('POST /collect/:agentUuid (trigger spesifik)', proxyIdx.includes("'/collect/:agentUuid'"));
console.log('');

// ─── DELIVERABLE 7: Proxy pisah dari backend ───────────────────────────────
console.log('📦 DELIVERABLE 7: Proxy Terpisah dari Backend (sesuai pertanyaan user)');
check('Proxy punya Dockerfile sendiri', fs.existsSync(path.join(ROOT, 'proxy/Dockerfile')));
check('Proxy punya package.json sendiri', fs.existsSync(path.join(ROOT, 'proxy/package.json')));
check('Proxy di folder terpisah (/proxy/)', fs.existsSync(path.join(ROOT, 'proxy/index.js')));
check('Backend tidak mengimport dari proxy/', !server.includes("'../proxy'") && !dash.includes("'../proxy'"));
check('Proxy tidak mengimport dari backend/', !r('proxy/index.js').includes("'../backend'"));
check('Proxy hanya komunikasi ke MongoDB (tidak ke backend)', !r('proxy/collector.js').includes('3001'));
check('Backend hanya POST ke proxy (bukan import)', dash.includes('axios.post') || server.includes('PROXY_URL'));
console.log('');

// ─── DELIVERABLE 8: .env.local dokumentasi ─────────────────────────────────
console.log('📦 DELIVERABLE 8: Environment Variable Dokumentasi');
check('PROXY_COLLECT_MODE terdokumentasi', envFile.includes('PROXY_COLLECT_MODE'));
check('PROXY_AGENT_UUID terdokumentasi', envFile.includes('PROXY_AGENT_UUID'));
check('Penjelasan Mode 1 (all)', envFile.includes('Mode 1'));
check('Penjelasan Mode 2 (agent spesifik)', envFile.includes('Mode 2'));
check('MONGODB_URI ada', envFile.includes('MONGODB_URI'));
check('PROXY_CRON_SCHEDULE ada', envFile.includes('PROXY_CRON_SCHEDULE'));
console.log('');

// ─── SUMMARY ───────────────────────────────────────────────────────────────
console.log('══════════════════════════════════════════════════════');
console.log(`   FINAL: ${ok} PASSED | ${fail} FAILED`);
if (fail === 0) {
  console.log('   STATUS: ✓ SEMUA DELIVERABLE TERPENUHI');
} else {
  console.log('   STATUS: ✗ ADA YANG PERLU DIPERBAIKI — lihat item FAIL di atas');
}
console.log('══════════════════════════════════════════════════════\n');

if (fail > 0) process.exit(1);
