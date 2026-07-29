// scripts/fix-and-restart.js
// ─────────────────────────────────────────────────────────────────────────────
// BackOne DPI — Fix standalone structure & reload PM2 with new code
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
  // ── Step 1: Fix the standalone directory structure ──────────────────────────
  // Next.js standalone server.js expects .next/static and public INSIDE the standalone dir
  `echo "=== STEP 1: Create standalone .next dir ==="`,
  `mkdir -p ${ROOT}/.next/standalone/.next/`,

  // Copy static chunks into standalone/.next/static
  `echo "=== STEP 2: Copy static assets into standalone ===" && cp -r ${ROOT}/.next/static ${ROOT}/.next/standalone/.next/static && echo "static copied OK"`,

  // Copy media files
  `ls ${ROOT}/.next/standalone/.next/static/ 2>/dev/null | wc -l | xargs -I{} echo "Files in standalone static: {}"`,

  // public is already copied in deploy script, verify it
  `ls ${ROOT}/.next/standalone/public/ 2>/dev/null | head -5 || echo "WARNING: public dir missing in standalone"`,

  // ── Step 2: Verify the ecosystem.config.js was updated ────────────────────
  `echo "=== STEP 3: Show ecosystem.config.js script path ===" && grep "script" ${ROOT}/ecosystem.config.js | head -5`,

  // ── Step 3: Reload PM2 with new ecosystem config ──────────────────────────
  // Use reload instead of restart to minimize downtime
  `echo "=== STEP 4: Reload PM2 frontend with new code ===" && cd ${ROOT} && NODE_ENV=production ${PM2} reload ecosystem.config.js --only backone-frontend 2>&1`,

  // Also reload backend to pick up new code
  `echo "=== STEP 5: Reload PM2 backend ===" && cd ${ROOT} && NODE_ENV=production ${PM2} reload ecosystem.config.js --only backone-backend 2>&1`,

  // Reload proxy as well (it was already restarted but ensure env is correct)
  `echo "=== STEP 6: Reload PM2 proxy ===" && cd ${ROOT} && NODE_ENV=production ${PM2} reload ecosystem.config.js --only backone-proxy 2>&1`,

  // ── Step 4: Save PM2 state for auto-restart on reboot ─────────────────────
  `echo "=== STEP 7: Save PM2 state ===" && ${PM2} save && echo "PM2 state saved"`,

  // ── Step 5: Wait for processes to stabilize ────────────────────────────────
  `sleep 8`,

  // ── Step 6: Verify all processes ──────────────────────────────────────────
  `echo "=== STEP 8: PM2 Status ===" && ${PM2} list`,

  // ── Step 7: Health checks ─────────────────────────────────────────────────
  `echo "=== BACKEND HEALTH ===" && curl -s http://127.0.0.1:3001/api/health`,
  `echo ""`,
  `echo "=== FRONTEND HTTP STATUS ===" && curl -s -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:3000/ && echo ""`,
  `echo "=== FRONTEND LOGIN PAGE ===" && curl -s -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:3000/login && echo ""`,

  // ── Step 8: Check port 3000 is now listening ──────────────────────────────
  `echo "=== PORT 3000 STATUS ===" && ss -tlnp 2>/dev/null | grep 3000 || netstat -tlnp 2>/dev/null | grep 3000 || echo "Port 3000 check done"`,

  // ── Step 9: Show frontend logs ────────────────────────────────────────────
  `echo "=== FRONTEND PM2 LOG (last 20 lines) ===" && ${PM2} logs backone-frontend --lines 20 --nostream 2>&1 | tail -25`,

  // ── Step 10: Show proxy MongoDB connection status ─────────────────────────
  `echo "=== PROXY LOG (last 15 lines) ===" && ${PM2} logs backone-proxy --lines 15 --nostream 2>&1 | tail -20`,
];

function runSshCommands(commands) {
  return new Promise((resolve, reject) => {
    const ssh = new SshClient();

    ssh.on('ready', () => {
      console.log('[SSH] Connected!\n');
      let index = 0;

      function runNext() {
        if (index >= commands.length) {
          ssh.end();
          return;
        }

        const cmd = commands[index++];
        const preview = cmd.length > 150 ? cmd.substring(0, 150) + '...' : cmd;
        console.log(`\n$ ${preview}`);

        ssh.exec(cmd, (err, stream) => {
          if (err) {
            console.error(`[ERROR] ${err.message}`);
            runNext();
            return;
          }

          stream.on('data', (data) => process.stdout.write(data.toString()));
          stream.stderr.on('data', (data) => {
            const text = data.toString();
            if (!text.includes('npm warn') && !text.includes('npm notice')) {
              process.stdout.write(`[ERR] ${text}`);
            }
          });
          stream.on('close', () => runNext());
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
  console.log('║  BackOne DPI — Fix Standalone & Reload PM2              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    await runSshCommands(COMMANDS);
    console.log('\n✅ Fix & reload complete!\n');
  } catch (err) {
    console.error('\n[FATAL]', err.message);
    process.exit(1);
  }
}

main();
