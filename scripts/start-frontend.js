// scripts/start-frontend.js  
// ─────────────────────────────────────────────────────────────────────────────
// BackOne DPI — Start Frontend & Fix PM2 Setup on Server
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

const COMMANDS = [
  // Check what's currently running on port 3000
  'echo "=== PORT 3000 CHECK ===" && ss -tlnp 2>/dev/null | grep 3000 || netstat -tlnp 2>/dev/null | grep 3000 || echo "Port 3000 not in use"',
  
  // Check if standalone server.js exists
  `echo "=== STANDALONE CHECK ===" && ls -la ${REMOTE_ROOT}/.next/standalone/server.js 2>/dev/null || echo "standalone server.js NOT FOUND"`,
  
  // List standalone directory structure
  `echo "=== STANDALONE DIRECTORY ===" && ls ${REMOTE_ROOT}/.next/standalone/ 2>/dev/null | head -20`,
  
  // Check static assets copied correctly
  `echo "=== STATIC IN STANDALONE ===" && ls ${REMOTE_ROOT}/.next/standalone/.next/ 2>/dev/null || echo "No .next dir in standalone"`,

  // Find the correct npm bin directory for npx pm2
  'echo "=== NPM BIN DIR ===" && npm bin 2>/dev/null || npm config get prefix',

  // Check npx pm2 path
  'echo "=== NPX PM2 PATH ===" && find /home/adminbackend/.npm -name "pm2" -type f 2>/dev/null | grep "/bin/pm2" | head -3',
  
  // Install PM2 using npm to user's npm prefix 
  'echo "=== SET NPM PREFIX ===" && npm config set prefix /home/adminbackend/.npm-global && npm install -g pm2 2>&1 | tail -5',
  'echo "=== PM2 INSTALLED ===" && /home/adminbackend/.npm-global/bin/pm2 --version 2>&1 || echo "Still not found"',

  // Try npx approach
  `echo "=== USING NPX PM2 ===" && cd ${REMOTE_ROOT} && npx pm2 --version 2>&1`,

  // Start frontend standalone server if not running
  `echo "=== CHECKING STANDALONE SERVER ===" && ls -la ${REMOTE_ROOT}/.next/standalone/server.js`,

  // Start with nohup (works on cPanel)
  `echo "=== STARTING FRONTEND NOHUP ===" && cd ${REMOTE_ROOT} && NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_PUBLIC_API_URL=http://127.0.0.1:3001 nohup node .next/standalone/server.js >> logs/frontend-out.log 2>&1 & echo "PID: $!"`,

  // Wait and check
  'sleep 5',

  // Verify port 3000 is now listening
  'echo "=== PORT 3000 AFTER START ===" && ss -tlnp | grep 3000 || netstat -tlnp | grep 3000 || echo "Port 3000 still not in use"',

  // Check all running processes  
  'echo "=== ALL NODE PROCESSES ===" && ps aux | grep node | grep -v grep',

  // Test all endpoints
  'echo "=== BACKEND HEALTH ===" && curl -s http://127.0.0.1:3001/api/health',
  'echo "=== FRONTEND RESPONSE ===" && curl -s -o /dev/null -w "HTTP Status: %{http_code}" http://127.0.0.1:3000/ 2>&1',

  // Show frontend log
  `echo "=== FRONTEND LOG ===" && tail -20 ${REMOTE_ROOT}/logs/frontend-out.log 2>/dev/null || echo "No frontend log"`,
  
  // Check proxy connection to MongoDB
  `echo "=== PROXY LOG ===" && tail -10 ${REMOTE_ROOT}/logs/proxy-out.log 2>/dev/null || echo "No proxy log"`,
  
  // Show existing pm2 in npx cache and start all services via npx pm2
  `echo "=== STARTING WITH NPX PM2 ===" && cd ${REMOTE_ROOT} && NODE_ENV=production npx pm2 list 2>&1 | head -20`,
];

function runSshCommands(commands) {
  return new Promise((resolve, reject) => {
    const ssh = new SshClient();
    const results = [];

    ssh.on('ready', () => {
      console.log('[SSH] Connected!\n');
      let index = 0;

      function runNext() {
        if (index >= commands.length) {
          ssh.end();
          return;
        }

        const cmd = commands[index++];
        const preview = cmd.length > 120 ? cmd.substring(0, 120) + '...' : cmd;
        console.log(`\n$ ${preview}`);

        ssh.exec(cmd, { env: { PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' } }, (err, stream) => {
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
      ssh.on('end', () => resolve(results));
    });

    ssh.on('error', reject);
    ssh.connect({ ...CONFIG, readyTimeout: 30000 });
  });
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  BackOne DPI — Frontend Startup & PM2 Fix        ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  try {
    await runSshCommands(COMMANDS);
    console.log('\n✅ Frontend startup attempt complete!\n');
  } catch (err) {
    console.error('\n[FATAL]', err.message);
    process.exit(1);
  }
}

main();
