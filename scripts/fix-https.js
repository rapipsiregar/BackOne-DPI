// scripts/fix-https.js
// ─────────────────────────────────────────────────────────────────────────────
// BackOne DPI — Fix HTTPS 502 Bad Gateway Issue
// The cPanel Apache proxy is getting 502 — need to investigate and fix
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const { Client: SshClient } = require('ssh2');

const CONFIG = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
};

const ROOT = '/home/adminbackend/web/demoplace.my.id/public_html';
const PM2  = '/home/adminbackend/.npm-global/bin/pm2';

const COMMANDS = [
  // Check current frontend status
  `echo "=== FRONTEND PROCESS ==="`,
  `ps aux | grep node | grep -v grep`,
  `ss -tlnp | grep 3000`,

  // Check if frontend is responding internally
  `echo "=== INTERNAL FRONTEND TEST ===" && curl -sv http://127.0.0.1:3000/ 2>&1 | grep -E "(< HTTP|< Location|Connected|curl)" | head -10`,

  // Check the .htaccess to confirm proxy setup
  `echo "=== .HTACCESS CONTENT ===" && cat ${ROOT}/.htaccess`,

  // Check Apache error log for this domain
  `echo "=== APACHE ERROR (last 20 lines) ===" && tail -20 /home/adminbackend/logs/demoplace.my.id-ssl_log 2>/dev/null || tail -20 /home/adminbackend/logs/demoplace.my.id-error_log 2>/dev/null || tail -20 /home/adminbackend/logs/error_log 2>/dev/null || echo "No Apache error log found"`,

  // Check all logs
  `echo "=== LOG FILES ===" && ls /home/adminbackend/logs/ 2>/dev/null | head -20`,

  // Check domain SSL logs
  `echo "=== SSL LOG ===" && tail -30 /home/adminbackend/logs/demoplace.my.id-ssl_log 2>/dev/null | grep -E "(502|500|error|proxy)" | tail -15 || echo "No SSL log"`,

  // Try the domain via HTTP (non-SSL)
  `echo "=== HTTP (non-SSL) TEST ===" && curl -sv http://demoplace.my.id/ 2>&1 | grep -E "(< HTTP|Location|Connected)" | head -5`,

  // Check PM2 frontend is running
  `echo "=== PM2 FRONTEND STATUS ===" && ${PM2} show backone-frontend 2>&1 | grep -E "(status|pid|uptime|restart)" | head -10`,

  // Check frontend log for errors
  `echo "=== FRONTEND LOG (errors) ===" && ${PM2} logs backone-frontend --lines 30 --nostream 2>&1 | grep -E "(Error|error|ECONNRESET|Ready|✓)" | tail -15`,

  // Re-check port
  `echo "=== PORT 3000 DETAILED ===" && ss -tlnp | grep 3000`,

  // Try direct curl to frontend with more verbose output
  `echo "=== DETAILED FRONTEND CURL ===" && curl -v http://127.0.0.1:3000/login 2>&1 | head -30`,

  // Check if there's an issue with the standalone server path in PM2
  `echo "=== PM2 SCRIPT PATH ===" && ${PM2} show backone-frontend 2>&1 | grep -E "(script|cwd|exec)" | head -5`,

  // Check node version
  `echo "=== NODE VERSION ===" && node --version`,

  // Check if frontend started correctly after restart
  `echo "=== FRONTEND READY STATUS ===" && ${PM2} logs backone-frontend --lines 10 --nostream 2>&1 | tail -15`,

  // Try restarting frontend
  `echo "=== RESTARTING FRONTEND ===" && ${PM2} restart backone-frontend && sleep 5 && echo "Restarted"`,

  // Final port check
  `echo "=== FINAL PORT CHECK ===" && ss -tlnp | grep 3000`,
  `echo "=== FINAL CURL ===" && curl -s -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:3000/login`,

  // Check if maybe cPanel node app is conflicting
  `echo "=== CPANEL NODE APPS ===" && ls /home/adminbackend/nodevenv/ 2>/dev/null || echo "No cPanel Node.js virtual environments"`,
  `cat /home/adminbackend/.cpanel/nvdata/node_application_config 2>/dev/null | head -30 || echo "No cPanel Node config"`,
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

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   BackOne DPI — HTTPS 502 Investigation & Fix           ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  await runSsh(COMMANDS);
  console.log('\n✅ Investigation complete!\n');
}

main().catch(err => { console.error('[FATAL]', err); process.exit(1); });
