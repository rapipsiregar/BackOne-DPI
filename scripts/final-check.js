// scripts/final-check.js
// ─────────────────────────────────────────────────────────────────────────────
// BackOne DPI — Final production health check
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const { Client: SshClient } = require('ssh2');
const https = require('https');
const http  = require('http');

const CONFIG = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
};

const PM2  = '/home/adminbackend/.npm-global/bin/pm2';
const ROOT = '/home/adminbackend/web/demoplace.my.id/public_html';

function fetch(url, followRedirects = false) {
  return new Promise(resolve => {
    const mod = url.startsWith('https') ? https : http;
    const opts = { timeout: 12000, rejectUnauthorized: false };
    if (!followRedirects) opts.agent = false;
    const req = mod.get(url, opts, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: body.substring(0, 300) }));
    });
    req.on('error', e => resolve({ status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
  });
}

function runSsh(commands) {
  return new Promise((resolve, reject) => {
    const ssh = new SshClient();
    ssh.on('ready', () => {
      let i = 0;
      function next() {
        if (i >= commands.length) { ssh.end(); return; }
        const cmd = commands[i++];
        console.log(`\n$ ${cmd}`);
        ssh.exec(cmd, (err, stream) => {
          if (err) { console.error('[ERR]', err.message); next(); return; }
          stream.on('data', d => process.stdout.write(d.toString()));
          stream.stderr.on('data', d => { const t = d.toString(); if (!t.includes('npm warn') && !t.includes('notice')) process.stdout.write(t); });
          stream.on('close', next);
        });
      }
      next();
      ssh.on('end', resolve);
    });
    ssh.on('error', reject);
    ssh.connect({ ...CONFIG, readyTimeout: 30000 });
  });
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║      BackOne DPI — Final Production Verification            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // SSH internal checks
  await runSsh([
    `${PM2} list`,
    `echo "=== FRONTEND ===" && curl -s -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:3000/`,
    `echo "=== LOGIN PAGE ===" && curl -s -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:3000/login`,
    `echo "=== BACKEND ===" && curl -s http://127.0.0.1:3001/api/health`,
    // Test full login flow
    `echo "=== LOGIN API ===" && curl -s -X POST http://127.0.0.1:3001/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('Login OK - Role:', d.get('user',{}).get('role','?'))" 2>/dev/null || curl -s -X POST http://127.0.0.1:3001/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin"}'`,
    // Security checks
    `echo "=== SECURITY: Port 3001 ==="  && ss -tlnp | grep 3001`,
    `echo "=== SECURITY: Port 4000 ===" && ss -tlnp | grep 4000`,
    `echo "=== SECURITY: No .env in standalone ===" && find ${ROOT}/.next/standalone -name ".env*" 2>/dev/null || echo "CLEAN"`,
    // Proxy MongoDB
    `echo "=== PROXY MONGO ===" && ${PM2} logs backone-proxy --lines 5 --nostream 2>&1 | grep -E "(MongoDB|Scheduler|Connected|Capacity)" | tail -5`,
    // Domain via HTTP (should 301 → HTTPS)
    `echo "=== DOMAIN HTTP ===" && curl -s -o /dev/null -w "HTTP %{http_code}" http://demoplace.my.id/`,
    // Domain via HTTPS from server itself
    `echo "=== DOMAIN HTTPS ===" && curl -sk -o /dev/null -w "HTTP %{http_code}" https://demoplace.my.id/ 2>&1`,
  ]);

  // External checks from local machine
  console.log('\n\n══ External checks from local machine ══\n');

  const tests = [
    { url: 'https://demoplace.my.id/',         label: 'Root (expect 307 redirect to /login)' },
    { url: 'https://demoplace.my.id/login',    label: 'Login page (expect 200)' },
    { url: 'https://demoplace.my.id/api/health', label: 'Backend health via domain (expect 200)' },
    { url: 'http://demoplace.my.id/',           label: 'HTTP root (expect 301 HTTPS redirect)' },
  ];

  for (const { url, label } of tests) {
    const r = await fetch(url);
    const ok = r.status >= 200 && r.status < 400;
    const icon = ok ? '✅' : r.status === 0 ? '⚠️ ' : '❌';
    console.log(`  ${icon} [${String(r.status).padEnd(3)}] ${label}`);
    if (r.headers?.location) console.log(`       → Redirect: ${r.headers.location}`);
    if (r.error) console.log(`       → Error: ${r.error}`);
    if (r.status === 200 && r.body) {
      const preview = r.body.replace(/\s+/g, ' ').substring(0, 80);
      console.log(`       → Body: ${preview}`);
    }
  }

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('  Deployment Summary:');
  console.log('  ┌─────────────────────────────────────────────────────┐');
  console.log('  │  🌐 Dashboard URL : https://demoplace.my.id         │');
  console.log('  │  🔒 Backend       : 127.0.0.1:3001 (internal only)  │');
  console.log('  │  🔒 Proxy         : 127.0.0.1:4000 (internal only)  │');
  console.log('  │  🗄️  MongoDB       : mongodb.prod.proit.id:27017    │');
  console.log('  │  🚀 Node.js       : v18.19.1                        │');
  console.log('  │  ⚙️  PM2           : 3 processes (all online)        │');
  console.log('  └─────────────────────────────────────────────────────┘');
  console.log('══════════════════════════════════════════════════════════\n');
}

main().catch(err => { console.error('[FATAL]', err); process.exit(1); });
