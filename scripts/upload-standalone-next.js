// scripts/upload-standalone-next.js
// ─────────────────────────────────────────────────────────────────────────────
// BackOne DPI — Upload missing .next/standalone/.next/ directory to server
// This fixes: "Could not find a production build in the './.next' directory"
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const path = require('path');
const fs   = require('fs');
const SftpClient = require('ssh2-sftp-client');
const { Client: SshClient } = require('ssh2');

const LOCAL_ROOT  = path.resolve(__dirname, '..');
const REMOTE_ROOT = '/home/adminbackend/web/demoplace.my.id/public_html';
const PM2         = '/home/adminbackend/.npm-global/bin/pm2';

const CONFIG = {
  host:     '103.185.47.52',
  port:     2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
};

// Recursively upload a local directory to remote (skipping node_modules and .git)
async function uploadDir(sftp, localPath, remotePath) {
  const items = fs.readdirSync(localPath, { withFileTypes: true });
  try { await sftp.mkdir(remotePath, true); } catch {}

  for (const item of items) {
    if (['node_modules', '.git'].includes(item.name)) continue;
    if (item.name.endsWith('.log')) continue;

    const lp = path.join(localPath, item.name);
    const rp = remotePath + '/' + item.name;

    if (item.isDirectory()) {
      process.stdout.write(`  [DIR]  ${rp}\n`);
      await uploadDir(sftp, lp, rp);
    } else {
      process.stdout.write(`  [UP]   ${rp} ...`);
      await sftp.put(lp, rp);
      process.stdout.write(' done\n');
    }
  }
}

function runSsh(commands) {
  return new Promise((resolve, reject) => {
    const ssh = new SshClient();
    ssh.on('ready', () => {
      let i = 0;
      function next() {
        if (i >= commands.length) { ssh.end(); return; }
        const cmd = commands[i++];
        console.log(`\n$ ${cmd.substring(0, 120)}${cmd.length > 120 ? '...' : ''}`);
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
  console.log('║  BackOne DPI — Upload Standalone Build Artifacts        ║');
  console.log('║  Uploading: .next/standalone/.next/ (BUILD_ID + server) ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const localStandaloneNext = path.join(LOCAL_ROOT, '.next', 'standalone', '.next');
  if (!fs.existsSync(localStandaloneNext)) {
    console.error('✗ ERROR: .next/standalone/.next not found locally!');
    console.error('  Run: npm run build');
    process.exit(1);
  }

  // Verify BUILD_ID exists
  const buildId = fs.existsSync(path.join(localStandaloneNext, 'BUILD_ID'))
    ? fs.readFileSync(path.join(localStandaloneNext, 'BUILD_ID'), 'utf8').trim()
    : null;
  console.log(`✓ Build ID: ${buildId || 'NOT FOUND'}`);
  console.log(`✓ Local path: ${localStandaloneNext}`);

  const sftp = new SftpClient();
  try {
    await sftp.connect(CONFIG);
    console.log('[SFTP] Connected!\n');

    const remotePath = `${REMOTE_ROOT}/.next/standalone/.next`;
    console.log(`\n[DIR] Uploading .next/standalone/.next/ → ${remotePath}\n`);
    await uploadDir(sftp, localStandaloneNext, remotePath);

    console.log('\n[SFTP] Upload complete!\n');
  } finally {
    await sftp.end();
  }

  // Post-upload: restart PM2 frontend, verify
  console.log('\n▶ Restarting PM2 frontend with new build...\n');
  await runSsh([
    // Verify BUILD_ID now exists on server
    `echo "=== VERIFY BUILD_ID ===" && cat ${REMOTE_ROOT}/.next/standalone/.next/BUILD_ID`,

    // Also verify static dir exists
    `echo "=== VERIFY STATIC ===" && ls ${REMOTE_ROOT}/.next/standalone/.next/static/ 2>/dev/null | wc -l | xargs echo "Static files:"`,

    // Restart frontend PM2 process
    `echo "=== RESTARTING FRONTEND ===" && ${PM2} restart backone-frontend --update-env && echo "Restarted"`,

    // Wait
    `sleep 6`,

    // Check PM2 status
    `echo "=== PM2 STATUS ===" && ${PM2} list`,

    // Test internal endpoints
    `echo "=== FRONTEND / ===" && curl -s -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:3000/`,
    `echo "=== FRONTEND /login ===" && curl -s -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:3000/login`,
    `echo "=== BACKEND HEALTH ===" && curl -s http://127.0.0.1:3001/api/health`,

    // Show frontend log
    `echo "=== FRONTEND LOG ===" && ${PM2} logs backone-frontend --lines 10 --nostream 2>&1 | tail -15`,

    // Test via domain (HTTP which redirects to HTTPS via .htaccess)
    `echo "=== DOMAIN HTTP TEST ===" && curl -s -o /dev/null -w "HTTP %{http_code}" http://demoplace.my.id/`,

    // Check port 3000
    `echo "=== PORT 3000 ===" && ss -tlnp | grep 3000`,
  ]);

  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  ✅ Standalone build artifacts uploaded & frontend restarted!');
  console.log('  🌐 Dashboard: https://demoplace.my.id');
  console.log('══════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\n[FATAL]', err.message);
  process.exit(1);
});
