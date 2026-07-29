// scripts/verify-deployment.js
// ─────────────────────────────────────────────────────────────────────────────
// BackOne DPI — Post-Deployment Verification Script
// Tests: frontend, backend, security headers, proxy, MongoDB
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

const PM2 = '/home/adminbackend/.npm-global/bin/pm2';
const ROOT = '/home/adminbackend/web/demoplace.my.id/public_html';

// HTTP request helper
function httpGet(url) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: 10000 }, (res) => {
      let body = '';
      res.on('data', (d) => body += d);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: body.substring(0, 300) }));
    });
    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
  });
}

const SSH_COMMANDS = [
  // Check PM2 process list
  `echo "=== PM2 STATUS ===" && ${PM2} list`,

  // Check backend health
  `echo "=== BACKEND HEALTH ===" && curl -s http://127.0.0.1:3001/api/health`,

  // Check frontend pages
  `echo "=== FRONTEND / ===" && curl -s -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:3000/`,
  `echo "=== FRONTEND /login ===" && curl -s -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:3000/login`,

  // Security audit: ensure backend and proxy ports are NOT publicly accessible
  `echo "=== SECURITY: Port 3001 external test ===" && ss -tlnp | grep 3001`,
  `echo "=== SECURITY: Port 4000 external test ===" && ss -tlnp | grep 4000`,

  // Check upload directory permissions
  `echo "=== UPLOAD DIR PERMS ===" && ls -la ${ROOT}/backend/public/api/uploads/ 2>/dev/null || echo "Upload dir does not exist yet (will be created on first upload)"`,

  // Check proxy MongoDB connection
  `echo "=== PROXY STATUS ===" && ${PM2} logs backone-proxy --lines 5 --nostream 2>&1 | grep -E "(MongoDB|Connected|Capacity|Scheduler)" | tail -10`,

  // Verify no secrets in Next.js build output (sanity check)
  `echo "=== SECURITY AUDIT: Check no API key in build ===" && grep -r "sk_db_live" ${ROOT}/.next/standalone/ 2>/dev/null | head -3 || echo "CLEAN: No Netify API key found in build output"`,
  `echo "=== SECURITY AUDIT: Check no MongoDB URI in build ===" && grep -r "backone_user" ${ROOT}/.next/standalone/ 2>/dev/null | head -3 || echo "CLEAN: No MongoDB credentials in build output"`,

  // Check frontend log for readiness
  `echo "=== FRONTEND READY LOG ===" && ${PM2} logs backone-frontend --lines 5 --nostream 2>&1 | grep -E "(Ready|Error|Next.js)" | tail -10`,

  // Check disk usage for uploads dir
  `echo "=== DISK USAGE ===" && df -h /home/adminbackend/web/ 2>/dev/null | tail -2`,

  // Final summary
  `echo ""`,
  `echo "╔════════════════════════════════════════════╗"`,
  `echo "║  BackOne DPI Production — Service Status   ║"`,
  `echo "╠════════════════════════════════════════════╣"`,
  `${PM2} list 2>/dev/null | grep -E "(online|error|stopped)" | awk '{printf "║  %-12s  %-10s  %-8s   ║\\n", $2, $10, $8}'`,
  `echo "╚════════════════════════════════════════════╝"`,
];

function runSshChecks(commands) {
  return new Promise((resolve, reject) => {
    const ssh = new SshClient();

    ssh.on('ready', () => {
      console.log('[SSH] Connected for verification!\n');
      let index = 0;

      function runNext() {
        if (index >= commands.length) {
          ssh.end();
          return;
        }
        const cmd = commands[index++];
        console.log(`\n$ ${cmd.substring(0, 120)}${cmd.length > 120 ? '...' : ''}`);

        ssh.exec(cmd, (err, stream) => {
          if (err) { console.error(`[ERROR] ${err.message}`); runNext(); return; }
          stream.on('data', (d) => process.stdout.write(d.toString()));
          stream.stderr.on('data', (d) => {
            const t = d.toString();
            if (!t.includes('npm warn') && !t.includes('npm notice')) process.stdout.write(t);
          });
          stream.on('close', runNext);
        });
      }

      runNext();
      ssh.on('end', resolve);
    });
    ssh.on('error', reject);
    ssh.connect({ ...CONFIG, readyTimeout: 30000 });
  });
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║     BackOne DPI — Post-Deployment Verification          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // ── SSH internal checks ───────────────────────────────────────────────────
  console.log('▶ Running internal server checks via SSH...');
  await runSshChecks(SSH_COMMANDS);

  // ── External HTTP checks (from this machine) ──────────────────────────────
  console.log('\n\n▶ Running external HTTP checks from local machine...\n');

  const checks = [
    { url: 'http://demoplace.my.id/', label: 'Domain root (redirect expected)' },
    { url: 'http://demoplace.my.id/login', label: 'Login page' },
    { url: 'http://demoplace.my.id/api/health', label: 'Backend health via domain' },
  ];

  for (const { url, label } of checks) {
    const result = await httpGet(url);
    const status = result.status;
    const icon = (status >= 200 && status < 400) ? '✅' : (status === 0 ? '⚠️' : '❌');
    console.log(`  ${icon} ${label}: HTTP ${status} ${result.error || ''}`);
    if (result.body && status >= 200 && status < 300) {
      console.log(`     Body preview: ${result.body.substring(0, 100)}`);
    }
  }

  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  Production deployment verification complete!');
  console.log('  URL: https://demoplace.my.id');
  console.log('══════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('[FATAL]', err.message);
  process.exit(1);
});
