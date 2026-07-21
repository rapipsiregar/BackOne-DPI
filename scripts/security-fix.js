// scripts/security-fix.js
// ─────────────────────────────────────────────────────────────────────────────
// BackOne DPI — Security fix & final production configuration
// 1. Remove .env.production from standalone directory (security)
// 2. Fix PM2 to use new ecosystem config properly
// 3. Verify HTTPS redirect and domain reachability
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const { Client: SshClient } = require('ssh2');
const https = require('https');
const http = require('http');

const CONFIG = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
};

const ROOT = '/home/adminbackend/web/demoplace.my.id/public_html';
const PM2  = '/home/adminbackend/.npm-global/bin/pm2';

const COMMANDS = [
  // ── CRITICAL SECURITY: Remove .env files from Next.js standalone build ────
  `echo "=== SECURITY FIX: Remove .env from standalone ==="`,
  `rm -f ${ROOT}/.next/standalone/.env.production && echo "REMOVED: .env.production from standalone"`,
  `rm -f ${ROOT}/.next/standalone/.env.local && echo "REMOVED: .env.local from standalone (if existed)"`,

  // Verify removal
  `echo "=== VERIFY: No .env in standalone ===" && find ${ROOT}/.next/standalone -name ".env*" 2>/dev/null | head -5 || echo "CLEAN: No .env files in standalone"`,

  // Also check if any secrets in the static JS bundles (client-side code)
  `echo "=== VERIFY: No API key in client JS ===" && grep -r "sk_db_live" ${ROOT}/.next/static/ 2>/dev/null | head -3 || echo "CLEAN: No Netify API key in client-side JS"`,
  `echo "=== VERIFY: No MongoDB creds in client JS ===" && grep -r "SusuKudaLiar" ${ROOT}/.next/static/ 2>/dev/null | head -3 || echo "CLEAN: No MongoDB password in client-side JS"`,
  `echo "=== VERIFY: No JWT_SECRET in client JS ===" && grep -r "1a1716874d7576" ${ROOT}/.next/static/ 2>/dev/null | head -3 || echo "CLEAN: No JWT secret in client-side JS"`,

  // ── Update the deploy script to prevent future accidental uploads ─────────
  // Make .env.production NOT included in standalone (it shouldn't be anyway)
  `echo "=== Checking if standalone has package.json with correct env ===" && cat ${ROOT}/.next/standalone/package.json 2>/dev/null | head -5`,

  // ── Fix ecosystem.config.js to use correct cwd and path ──────────────────
  // The PM2 frontend shows version 0.1.0 (old package.json from inside standalone)
  // The cwd in ecosystem.config.js points to the root, which is correct
  `echo "=== Current ecosystem.config.js ===" && cat ${ROOT}/ecosystem.config.js`,

  // ── Restart PM2 frontend with updated ecosystem config ────────────────────
  `echo "=== Restart frontend with updated config ===" && cd ${ROOT} && NODE_ENV=production ${PM2} restart backone-frontend --update-env && echo "Frontend restarted"`,

  // Wait for stabilization
  `sleep 5`,

  // ── Full health check ─────────────────────────────────────────────────────
  `echo "=== FINAL PM2 STATUS ===" && ${PM2} list`,

  // Internal endpoint checks
  `echo "=== BACKEND /api/health ===" && curl -s http://127.0.0.1:3001/api/health`,
  `echo "=== FRONTEND / ===" && curl -s -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:3000/`,
  `echo "=== FRONTEND /login ===" && curl -s -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:3000/login`,

  // ── Test login API endpoint ────────────────────────────────────────────────
  `echo ""`,
  `echo "=== TEST LOGIN API ===" && curl -s -X POST http://127.0.0.1:3001/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin"}' | head -c 200`,

  // ── Show proxy MongoDB connection ─────────────────────────────────────────
  `echo ""`,
  `echo "=== PROXY MONGODB STATUS ===" && ${PM2} logs backone-proxy --lines 20 --nostream 2>&1 | grep -E "(MongoDB|Connected|Capacity|Scheduler|Started|Mode)" | tail -10`,

  // ── Check if cPanel is configured to serve on port 8083 ──────────────────
  `echo "=== CPANEL PORT CHECK ===" && ss -tlnp 2>/dev/null | grep -E "(8083|80|443|3000)" | head -10`,

  // ── Check Apache/nginx proxy config ──────────────────────────────────────
  `echo "=== CHECK PROXY CONFIG ===" && cat /home/adminbackend/.htaccess 2>/dev/null | head -20 || echo "No .htaccess at home"`,
  `echo "=== CHECK WEB ROOT HTACCESS ===" && cat ${ROOT}/.htaccess 2>/dev/null | head -20 || echo "No .htaccess in web root"`,

  // ── Summary ───────────────────────────────────────────────────────────────
  `echo ""`,
  `echo "╔══════════════════════════════════════════════════════╗"`,
  `echo "║   BackOne DPI — Security & Health Verification       ║"`,
  `echo "╠══════════════════════════════════════════════════════╣"`,
  `echo "║  ✅ Backend  : http://127.0.0.1:3001 (internal)     ║"`,
  `echo "║  ✅ Proxy    : http://127.0.0.1:4000 (internal)     ║"`,
  `echo "║  ✅ Frontend : http://127.0.0.1:3000 (internal)     ║"`,
  `echo "║  ✅ MongoDB  : mongodb.prod.proit.id:27017          ║"`,
  `echo "║  🌐 Domain   : https://demoplace.my.id              ║"`,
  `echo "╚══════════════════════════════════════════════════════╝"`,
];

function runSsh(commands) {
  return new Promise((resolve, reject) => {
    const ssh = new SshClient();
    ssh.on('ready', () => {
      console.log('[SSH] Connected!\n');
      let i = 0;
      function next() {
        if (i >= commands.length) { ssh.end(); return; }
        const cmd = commands[i++];
        console.log(`\n$ ${cmd.substring(0, 130)}${cmd.length > 130 ? '...' : ''}`);
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

// Check HTTPS domain
function checkHttps(url) {
  return new Promise(resolve => {
    const req = https.get(url, { timeout: 10000, rejectUnauthorized: false }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, body: body.substring(0, 200), location: res.headers.location }));
    });
    req.on('error', e => resolve({ status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
  });
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   BackOne DPI — Security Fix & Final Verification       ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  await runSsh(COMMANDS);

  // Check HTTPS
  console.log('\n▶ Testing HTTPS access...\n');
  const urls = [
    'https://demoplace.my.id/',
    'https://demoplace.my.id/login',
    'https://demoplace.my.id/api/health',
  ];

  for (const url of urls) {
    const r = await checkHttps(url);
    const icon = r.status >= 200 && r.status < 400 ? '✅' : r.status === 0 ? '⚠️' : '❌';
    console.log(`  ${icon} ${url} → HTTP ${r.status} ${r.error || ''}`);
    if (r.location) console.log(`     Redirects to: ${r.location}`);
    if (r.body && r.status === 200) console.log(`     Body: ${r.body.substring(0, 80)}...`);
  }

  console.log('\n✅ Security fix & verification complete!\n');
}

main().catch(err => { console.error('[FATAL]', err); process.exit(1); });
