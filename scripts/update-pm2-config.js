// scripts/update-pm2-config.js
// ─────────────────────────────────────────────────────────────────────────────
// BackOne DPI — Update PM2 to use correct standalone script path
// The frontend PM2 process is currently running the OLD server.js from root.
// We need to delete and re-create the PM2 process with the correct script.
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const { Client: SshClient } = require('ssh2');
const https = require('https');

const CONFIG = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
};

const ROOT = '/home/adminbackend/web/demoplace.my.id/public_html';
const PM2  = '/home/adminbackend/.npm-global/bin/pm2';

const COMMANDS = [
  // Show current PM2 state
  `echo "=== CURRENT PM2 STATE ===" && ${PM2} list`,
  `echo "=== CURRENT FRONTEND SCRIPT ===" && ${PM2} show backone-frontend 2>&1 | grep -E "(script|cwd)" | head -5`,

  // Delete old frontend process and start fresh with correct script
  `echo "=== DELETING OLD FRONTEND PROCESS ===" && ${PM2} delete backone-frontend && echo "Deleted"`,

  // Start frontend using the new ecosystem config (which points to .next/standalone/server.js)
  `echo "=== STARTING FRONTEND WITH NEW CONFIG ===" && cd ${ROOT} && NODE_ENV=production ${PM2} start ecosystem.config.js --only backone-frontend && echo "Started"`,

  // Wait for startup
  `sleep 6`,

  // Verify new process
  `echo "=== NEW PM2 STATUS ===" && ${PM2} list`,
  `echo "=== NEW FRONTEND SCRIPT ===" && ${PM2} show backone-frontend 2>&1 | grep -E "(script|cwd|version|status)" | head -8`,

  // Test frontend response
  `echo "=== FRONTEND INTERNAL TEST ===" && curl -s -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:3000/`,
  `echo "=== FRONTEND LOGIN TEST ===" && curl -s -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:3000/login`,

  // Save PM2 state
  `echo "=== SAVING PM2 STATE ===" && ${PM2} save && echo "PM2 state saved"`,

  // Show frontend log to confirm new code
  `echo "=== FRONTEND LOG ===" && ${PM2} logs backone-frontend --lines 10 --nostream 2>&1 | tail -15`,

  // Check HTTPS now
  `echo "=== HTTPS VIA CURL ===" && curl -s -o /dev/null -w "HTTP %{http_code}" -L --max-redirs 3 https://demoplace.my.id/ 2>&1 || echo "HTTPS not accessible from server itself"`,

  // Check HTTP (which should redirect to HTTPS per .htaccess)
  `echo "=== HTTP CHECK ===" && curl -s -o /dev/null -w "HTTP %{http_code}" http://demoplace.my.id/ 2>&1`,

  // Check Apache config for this domain
  `echo "=== APACHE VHOST CONFIG ===" && cat /etc/apache2/conf.d/userdata/ssl/2_4/adminbackend/demoplace.my.id/*.conf 2>/dev/null | head -30 || ls /etc/apache2/conf.d/userdata/ 2>/dev/null | head -5 || echo "No Apache vhost config accessible"`,

  // Check cPanel proxy config
  `echo "=== CPANEL PROXY CONF ===" && cat /home/adminbackend/.cpanel/ea4/php.conf 2>/dev/null || echo "No cPanel PHP conf"`,
  `cat /home/adminbackend/etc/apache_conf 2>/dev/null || echo "No Apache conf in home"`,

  // Final summary
  `echo ""`,
  `echo "╔══════════════════════════════════════════════════════╗"`,
  `echo "║   BackOne DPI — PM2 Update Complete                  ║"`,
  `${PM2} list 2>/dev/null | grep -E "(online|error)" | awk '{print "║  " $2 "  " $10 "  " $6 "  ║"}'`,
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

async function checkHttps(url) {
  return new Promise(resolve => {
    const req = https.get(url, { timeout: 10000, rejectUnauthorized: false }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, location: res.headers.location, body: body.substring(0, 150) }));
    });
    req.on('error', e => resolve({ status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
  });
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   BackOne DPI — Fix PM2 Script & HTTPS Verification     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  await runSsh(COMMANDS);

  console.log('\n\n▶ External HTTPS checks (from local machine)...\n');
  const checks = [
    'https://demoplace.my.id/',
    'https://demoplace.my.id/login',
    'https://demoplace.my.id/api/health',
  ];
  for (const url of checks) {
    const r = await checkHttps(url);
    const icon = r.status >= 200 && r.status < 400 ? '✅' : r.status === 0 ? '⚠️' : '❌';
    console.log(`  ${icon} ${url} → HTTP ${r.status} ${r.error || ''}`);
    if (r.location) console.log(`     → Redirects to: ${r.location}`);
    if (r.status === 200 && r.body) console.log(`     Body preview: ${r.body.substring(0, 100)}`);
  }

  console.log('\n✅ Done!\n');
}

main().catch(err => { console.error('[FATAL]', err); process.exit(1); });
