// scripts/hestia-nginx-fix.js
// ─────────────────────────────────────────────────────────────────────────────
// Fix 502 Bad Gateway dengan cara:
// 1. Cek permissions direktori conf Nginx
// 2. Gunakan Hestia CP REST API untuk ubah proxy template ke Node.js
// 3. Atau tulis nginx.conf_custom via Hestia API command
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const { Client } = require('ssh2');
const https = require('https');
const querystring = require('querystring');
const crypto = require('crypto');

const SSH = { host: '103.185.47.52', port: 2222, username: 'adminbackend', password: 'htEo7x6LsBQiEHHH', readyTimeout: 60000 };
const HESTIA_HOST = 'isp.proit.id';
const HESTIA_PORT = 8083;
const HESTIA_USER = 'admin';
const HESTIA_PASS = 'htEo7x6LsBQiEHHH';
const DOMAIN = 'demoplace.my.id';
const WEB_USER = 'adminbackend';
const CONF = `/home/${WEB_USER}/conf/web/${DOMAIN}`;

// ── Hestia CP API call ─────────────────────────────────────────────────────
function hestiaApi(cmd, args = []) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256').update(HESTIA_PASS).digest('hex');
    const body = querystring.stringify({ hash, cmd, ...Object.fromEntries(args.map((a, i) => [`arg${i + 1}`, a])) });
    const req = https.request({
      hostname: HESTIA_HOST,
      port: HESTIA_PORT,
      path: '/api/',
      method: 'POST',
      rejectUnauthorized: false,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data.trim() }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── SSH command runner ─────────────────────────────────────────────────────
function sshExec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('close', () => resolve(out))
            .on('data', d => { out += d; process.stdout.write(d.toString()); })
            .stderr.on('data', d => { out += d; process.stdout.write(d.toString()); });
    });
  });
}

// ── Custom Nginx config content ───────────────────────────────────────────
const nginxCustomContent = `# BackOne DPI — Proxy to Next.js port 3000
location / {
    proxy_pass         http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade           $http_upgrade;
    proxy_set_header   Connection        "upgrade";
    proxy_set_header   Host              $host;
    proxy_set_header   X-Real-IP         $remote_addr;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400;
}`;

const nginxSslContent = `# BackOne DPI — Proxy SSL to Next.js port 3000
location / {
    proxy_pass         http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade           $http_upgrade;
    proxy_set_header   Connection        "upgrade";
    proxy_set_header   Host              $host;
    proxy_set_header   X-Real-IP         $remote_addr;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto https;
    proxy_read_timeout 86400;
}`;

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   BackOne DPI — Fix 502 via Hestia API + Nginx Fix      ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // ── Step 1: Diagnose conf directory permissions via SSH ─────────────────
  console.log('\n▶ Step 1: Check conf directory permissions via SSH...');
  const conn = new Client();
  await new Promise((resolve, reject) => { conn.on('ready', resolve).on('error', reject).connect(SSH); });
  console.log('[SSH] Connected!\n');

  await sshExec(conn, `echo "=== CONF DIR PERMS ===" && ls -la /home/${WEB_USER}/conf/web/`);
  await sshExec(conn, `echo "=== DOMAIN CONF DIR ===" && ls -la ${CONF}/`);
  await sshExec(conn, `echo "=== EXISTING CUSTOM CONF ===" && ls -la ${CONF}/nginx.conf_* 2>/dev/null || echo "No custom conf yet"`);

  // ── Step 2: Try Python to write the file (avoids shell quoting issues) ──
  console.log('\n▶ Step 2: Attempting to write nginx.conf_custom via Python...');
  const pyScript = `python3 -c "
import os
content = '''${nginxCustomContent.replace(/'/g, "\\'")}'''
path = '${CONF}/nginx.conf_custom'
try:
    with open(path, 'w') as f:
        f.write(content + '\\n')
    print('[OK] Written: ' + path)
except Exception as e:
    print('[FAIL] ' + str(e))
"`;
  await sshExec(conn, pyScript);

  const pyScriptSsl = `python3 -c "
content = '''${nginxSslContent.replace(/'/g, "\\'")}'''
path = '${CONF}/nginx.ssl.conf_custom'
try:
    with open(path, 'w') as f:
        f.write(content + '\\n')
    print('[OK] Written: ' + path)
except Exception as e:
    print('[FAIL] ' + str(e))
"`;
  await sshExec(conn, pyScriptSsl);

  conn.end();

  // ── Step 3: Try Hestia CP REST API to restart web ─────────────────────
  console.log('\n▶ Step 3: Call Hestia CP REST API to restart web server...');

  // Try listing available proxy templates first
  console.log('\n  → Listing available proxy templates...');
  const templatesRes = await hestiaApi('v-list-web-templates-proxy', []);
  console.log(`  API Response [list-proxy-templates]: HTTP ${templatesRes.status}`);
  console.log(`  Body: ${templatesRes.body.substring(0, 300)}`);

  // Try to restart web via API
  console.log('\n  → Restarting web server via Hestia API...');
  const restartRes = await hestiaApi('v-restart-web', []);
  console.log(`  API Response [restart-web]: HTTP ${restartRes.status}`);
  console.log(`  Body: ${restartRes.body}`);

  // Try restart with correct user arg
  const restartRes2 = await hestiaApi('v-restart-web', [WEB_USER]);
  console.log(`  API Response [restart-web user]: HTTP ${restartRes2.status}`);
  console.log(`  Body: ${restartRes2.body}`);

  // ── Step 4: Wait and test domain ─────────────────────────────────────
  console.log('\n▶ Step 4: Waiting 8 seconds then testing domain...');
  await new Promise(r => setTimeout(r, 8000));

  const testRes = await new Promise(resolve => {
    const req = https.get('https://demoplace.my.id/login', { timeout: 10000, rejectUnauthorized: false }, res => {
      resolve({ status: res.statusCode, location: res.headers.location });
    });
    req.on('error', e => resolve({ status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
  });

  const icon = testRes.status >= 200 && testRes.status < 400 ? '✅' : '❌';
  console.log(`\n  ${icon} https://demoplace.my.id/login → HTTP ${testRes.status} ${testRes.error || ''}`);
  if (testRes.location) console.log(`     Location: ${testRes.location}`);

  if (testRes.status >= 200 && testRes.status < 400) {
    console.log('\n🎉 SUKSES! Domain sudah bisa diakses!\n');
  } else {
    console.log('\n⚠️  Domain masih belum bisa diakses. Perlu konfig manual via Hestia panel.\n');
    console.log('Silakan buka Hestia CP File Manager dan buat file:');
    console.log(`  ${CONF}/nginx.conf_custom`);
    console.log(`  ${CONF}/nginx.ssl.conf_custom`);
    console.log('\nDengan isi (untuk keduanya):');
    console.log(nginxCustomContent);
    console.log('\nKemudian di Hestia CP: Web → demoplace.my.id → Rebuild\n');
  }
}

main().catch(err => { console.error('[FATAL]', err.message); process.exit(1); });
