// scripts/check-agents-error.js
'use strict';
const { Client } = require('ssh2');
const https = require('https');

const SSH = { host: '103.185.47.52', port: 2222, username: 'adminbackend', password: 'htEo7x6LsBQiEHHH', readyTimeout: 60000 };
const PUB = '/home/adminbackend/web/demoplace.my.id/public_html';

function exec(conn, cmd, label) {
  if (label) console.log('\n[' + label + ']');
  console.log('$ ' + cmd.substring(0, 80));
  return new Promise(resolve => {
    conn.exec(cmd, (err, s) => {
      if (err) { resolve(''); return; }
      let out = '';
      s.on('data', d => { out += d; process.stdout.write(d.toString()); })
       .stderr.on('data', d => { out += d; process.stdout.write(d.toString()); })
       .on('close', () => resolve(out));
    });
  });
}

async function httpGet(url, opts) {
  return new Promise(resolve => {
    const req = https.get(url, { timeout: 10000, rejectUnauthorized: false, ...opts }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, body: body.substring(0, 500) }));
    });
    req.on('error', e => resolve({ status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
  });
}

async function main() {
  const conn = new Client();
  await new Promise((r, j) => { conn.on('ready', r).on('error', j).connect(SSH); });
  console.log('[SSH] Connected\n');

  // 1. Cek error log frontend
  await exec(conn, 'tail -50 ' + PUB + '/logs/frontend-error.log 2>/dev/null | head -50', '1. Frontend error log');

  // 2. Cek frontend out log terbaru
  await exec(conn, 'tail -30 ' + PUB + '/logs/frontend-out.log 2>/dev/null', '2. Frontend out log');

  // 3. Test API agents langsung dari server
  await exec(conn, 'curl -sk http://127.0.0.1:3001/api/agents 2>/dev/null | head -c 500', '3. Test API /api/agents langsung');

  // 4. Test API health backend
  await exec(conn, 'curl -sk http://127.0.0.1:3001/api/health 2>/dev/null', '4. Test backend health');

  // 5. Cek .env.production - apakah BACKEND_URL benar
  await exec(conn, 'cat ' + PUB + '/.env.production 2>/dev/null | grep -v PASSWORD | grep -v SECRET | grep -v MONGO | head -20', '5. Environment variables (safe)');

  // 6. Cek apakah backend bisa akses agents collection dari MongoDB
  await exec(conn, 'curl -sk http://127.0.0.1:3001/api/agents/list 2>/dev/null | head -c 300', '6. Test /api/agents/list');

  conn.end();

  // 7. Test dari luar via domain
  console.log('\n[7. Test API agents via domain...]');
  const r = await httpGet('https://demoplace.my.id/api/agents');
  console.log('  Status: ' + r.status);
  console.log('  Body: ' + (r.body || r.error || 'empty'));
}

main().catch(e => console.error('[FATAL]', e.message));
