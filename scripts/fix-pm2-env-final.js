// scripts/fix-pm2-env-final.js
// Fix definitif: Buat startup wrapper script yang load .env.production sebelum menjalankan Next.js
'use strict';
const { Client } = require('ssh2');

const SSH = { host: '103.185.47.52', port: 2222, username: 'adminbackend', password: 'htEo7x6LsBQiEHHH', readyTimeout: 60000 };
const PUB = '/home/adminbackend/web/demoplace.my.id/public_html';
const PM2 = '/home/adminbackend/.npm-global/bin/pm2';

function exec(conn, cmd, label) {
  if (label) console.log('\n[' + label + ']');
  console.log('$ ' + cmd.substring(0, 90));
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

async function main() {
  const conn = new Client();
  await new Promise((r, j) => { conn.on('ready', r).on('error', j).connect(SSH); });
  console.log('[SSH] Connected\n');

  // 1. Buat wrapper script yang source .env.production
  const wrapperContent = [
    '#!/bin/bash',
    '# BackOne DPI - Frontend startup wrapper',
    '# Source environment variables from .env.production',
    'ENV_FILE="' + PUB + '/.env.production"',
    'if [ -f "$ENV_FILE" ]; then',
    '  set -a',
    '  source "$ENV_FILE"',
    '  set +a',
    '  echo "[startup] Environment variables loaded from .env.production"',
    'else',
    '  echo "[startup] WARNING: .env.production not found at $ENV_FILE"',
    'fi',
    '# Start Next.js standalone server',
    'exec node ' + PUB + '/.next/standalone/server.js',
  ].join('\n');

  await exec(conn,
    'cat > ' + PUB + '/start-frontend.sh << \'WRAPPER_EOF\'\n' + wrapperContent + '\nWRAPPER_EOF\n' +
    'chmod +x ' + PUB + '/start-frontend.sh && echo "Wrapper script dibuat"',
    '1. Buat wrapper startup script'
  );

  await exec(conn, 'cat ' + PUB + '/start-frontend.sh', '2. Verifikasi isi wrapper script');

  // 2. Update ecosystem.config.js di SERVER untuk gunakan wrapper script
  const ecosystemContent = `// ecosystem.config.js — PM2 Production Config (Server-side, DO NOT COMMIT)
module.exports = {
  apps: [
    {
      name: 'backone-proxy',
      script: './proxy/index.js',
      cwd: '${PUB}',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      node_args: '--max-old-space-size=256',
      max_memory_restart: '300M',
      restart_delay: 5000,
      max_restarts: 10,
      env_file: '.env.production',
      env: { NODE_ENV: 'production' },
      error_file: './logs/proxy-error.log',
      out_file: './logs/proxy-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    {
      name: 'backone-backend',
      script: './backend/server.js',
      cwd: '${PUB}',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      node_args: '--max-old-space-size=256',
      max_memory_restart: '400M',
      restart_delay: 3000,
      max_restarts: 10,
      env_file: '.env.production',
      env: { NODE_ENV: 'production' },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    {
      name: 'backone-frontend',
      script: './start-frontend.sh',
      interpreter: 'bash',
      cwd: '${PUB}',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '700M',
      restart_delay: 3000,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '127.0.0.1',
        NEXT_TELEMETRY_DISABLED: '1',
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};`;

  await exec(conn,
    'cat > ' + PUB + '/ecosystem.config.js << \'ECOSYSTEM_EOF\'\n' + ecosystemContent + '\nECOSYSTEM_EOF\n' +
    'echo "ecosystem.config.js diperbarui"',
    '3. Update ecosystem.config.js di server'
  );

  // 3. Delete & restart frontend dengan config baru
  await exec(conn,
    'cd ' + PUB + ' && ' + PM2 + ' delete backone-frontend 2>/dev/null; ' +
    PM2 + ' start ecosystem.config.js --only backone-frontend && echo "START OK"',
    '4. Start frontend dengan wrapper script'
  );

  // 4. Tunggu startup
  await new Promise(r => setTimeout(r, 8000));

  // 5. Verifikasi env vars
  const listOut = await exec(conn, PM2 + ' list 2>/dev/null | grep backone-frontend', '5. PM2 status');
  // Ambil ID proses baru
  const match = listOut.match(/│\s+(\d+)\s+│\s+backone-frontend/);
  if (match) {
    const newId = match[1];
    await exec(conn, PM2 + ' env ' + newId + ' 2>/dev/null | grep -E "(NETIFY|MONGO|JWT)" | head -5', '6. Env vars di proses baru');
  }

  // 6. Test agents
  await exec(conn, 'curl -sk -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:3000/agents', '7. Test /agents');

  // 7. Error log terbaru
  await exec(conn, 'tail -5 ' + PUB + '/logs/frontend-error.log 2>/dev/null', '8. Error log terbaru');
  await exec(conn, 'tail -3 ' + PUB + '/logs/frontend-out.log 2>/dev/null', '9. Out log terbaru');

  conn.end();
  console.log('\n✅ Selesai!\n');
}

main().catch(e => console.error('[FATAL]', e.message));
