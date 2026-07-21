// scripts/server-setup.js
// ─────────────────────────────────────────────────────────────────────────────
// BackOne DPI — Server Investigation & PM2 Setup Script
// Runs SSH commands to check server state and install PM2 locally
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const { Client: SshClient } = require('ssh2');

const CONFIG = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
};

const REMOTE_ROOT = '/home/adminbackend/web/demoplace.my.id/public_html';

// Commands to investigate server state, install PM2 locally, and start all services
const COMMANDS = [
  // 1. Check Node.js version and PATH
  'echo "=== NODE VERSION ===" && node --version 2>&1 || echo "node not in PATH"',
  'echo "=== NPM VERSION ===" && npm --version 2>&1 || echo "npm not in PATH"',
  'echo "=== CURRENT PATH ===" && echo $PATH',
  'echo "=== HOME DIR ===" && echo $HOME',

  // 2. Find any existing pm2 installation
  'echo "=== FIND PM2 ===" && which pm2 2>/dev/null || find /home/adminbackend -name "pm2" -type f 2>/dev/null | head -5 || echo "pm2 not found"',
  'echo "=== NPM GLOBAL LIST ===" && npm list -g --depth=0 2>&1 | head -20',

  // 3. Check currently running Node.js processes
  'echo "=== RUNNING NODE PROCESSES ===" && ps aux | grep node | grep -v grep || echo "No node processes running"',

  // 4. Check if cPanel Node.js App is configured
  'echo "=== CPANEL NODEAPP CONFIG ===" && ls /home/adminbackend/.cpanel/ 2>/dev/null || ls /home/adminbackend/nodevenv/ 2>/dev/null || echo "No cPanel node venv found"',
  'echo "=== NODE VENV CHECK ===" && ls /home/adminbackend/nodevenv/ 2>/dev/null | head -10 || echo "No nodevenv"',

  // 5. Install PM2 locally to user home prefix (no root needed)
  'echo "=== INSTALLING PM2 LOCALLY ===" && npm install pm2 --prefix /home/adminbackend/.local 2>&1 | tail -5',
  'echo "=== PM2 PATH ===" && /home/adminbackend/.local/bin/pm2 --version 2>&1 || echo "pm2 local install failed"',

  // 6. Kill any existing BackOne processes to avoid port conflicts
  `echo "=== KILLING EXISTING PROCESSES ===" && pkill -f "proxy/index.js" 2>/dev/null || true && pkill -f "backend/server.js" 2>/dev/null || true && pkill -f "standalone/server.js" 2>/dev/null || true && sleep 2 && echo "Done"`,

  // 7. Start backend server
  `echo "=== STARTING BACKEND ===" && cd ${REMOTE_ROOT} && NODE_ENV=production $(cat .env.production | grep -v '^#' | grep -v '^$' | xargs) node backend/server.js > logs/backend-out.log 2>logs/backend-error.log &`,

  // 8. Start proxy server
  `echo "=== STARTING PROXY ===" && cd ${REMOTE_ROOT} && NODE_ENV=production node proxy/index.js > logs/proxy-out.log 2>logs/proxy-error.log &`,

  // 9. Start Next.js frontend
  `echo "=== STARTING FRONTEND ===" && cd ${REMOTE_ROOT} && NODE_ENV=production PORT=3000 HOSTNAME=127.0.0.1 node .next/standalone/server.js > logs/frontend-out.log 2>logs/frontend-error.log &`,

  // 10. Wait and verify
  'sleep 6',

  // 11. Check processes
  'echo "=== RUNNING PROCESSES AFTER START ===" && ps aux | grep node | grep -v grep',

  // 12. Test health endpoints
  'echo "=== BACKEND HEALTH ===" && curl -s http://127.0.0.1:3001/api/health 2>&1 || echo "Backend not responding"',
  'echo "=== FRONTEND HEALTH ===" && curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ 2>&1 || echo "Frontend not responding"',

  // 13. Show recent logs
  'echo "=== BACKEND LOG (last 10 lines) ===" && tail -10 /home/adminbackend/web/demoplace.my.id/public_html/logs/backend-out.log 2>/dev/null || echo "No backend log"',
  'echo "=== PROXY LOG (last 5 lines) ===" && tail -5 /home/adminbackend/web/demoplace.my.id/public_html/logs/proxy-out.log 2>/dev/null || echo "No proxy log"',
];

function runSshCommands(commands) {
  return new Promise((resolve, reject) => {
    const ssh = new SshClient();

    ssh.on('ready', () => {
      console.log('[SSH] Connected to server!\n');
      let index = 0;

      function runNext() {
        if (index >= commands.length) {
          console.log('\n[SSH] All commands complete. Disconnecting...');
          ssh.end();
          return;
        }

        const cmd = commands[index++];
        console.log(`\n$ ${cmd.substring(0, 100)}${cmd.length > 100 ? '...' : ''}`);

        ssh.exec(cmd, (err, stream) => {
          if (err) {
            console.error(`[ERROR] ${err.message}`);
            runNext();
            return;
          }

          stream.on('data', (data) => process.stdout.write(data.toString()));
          stream.stderr.on('data', (data) => process.stdout.write(`[ERR] ${data}`));
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
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  BackOne DPI — Server Setup & Process Manager    ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  try {
    await runSshCommands(COMMANDS);
    console.log('\n✅ Server setup complete!\n');
  } catch (err) {
    console.error('\n[FATAL]', err.message);
    process.exit(1);
  }
}

main();
