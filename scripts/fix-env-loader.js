// scripts/fix-env-loader.js
// Fix: Buat Node.js env loader yang aman (tanpa bash glob expansion)
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

// Konten start-with-env.js yang akan ditulis ke server
const startWithEnvContent = `'use strict';
// Polyfill global crypto for Node 18 compatibility (required by mongodb driver)
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = require('crypto');
}
/**
 * BackOne DPI - Safe Environment Loader for Next.js Standalone
 * Reads .env.production safely without bash glob expansion issues.
 */
const path = require('path');
const fs   = require('fs');

const envFile = path.join(__dirname, '.env.production');

if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf8').split(/\\r?\\n/);
  let loaded = 0;
  for (const raw of lines) {
    const line = raw.trim();
    // Skip comments and empty lines
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.substring(0, eqIdx).trim();
    // Only accept valid environment variable names
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    const val = line.substring(eqIdx + 1); // Do NOT trim value - preserve exact content
    if (!(key in process.env)) {
      process.env[key] = val;
      loaded++;
    }
  }
  console.log('[startup] Loaded ' + loaded + ' environment variables from .env.production');
  console.log('[startup] NETIFY_API_KEY set:', !!process.env.NETIFY_API_KEY);
  console.log('[startup] MONGODB_URI set:    ', !!process.env.MONGODB_URI);
} else {
  console.warn('[startup] WARNING: .env.production not found at:', envFile);
}

// Start Next.js standalone server
require('./.next/standalone/server.js');
`;

async function main() {
  const conn = new Client();
  await new Promise((r, j) => { conn.on('ready', r).on('error', j).connect(SSH); });
  console.log('[SSH] Connected\n');

  // 1. Upload start-with-env.js ke server
  await exec(conn,
    'cat > ' + PUB + '/start-with-env.js << \'NODELOADER_EOF\'\n' + startWithEnvContent + '\nNODELOADER_EOF\n' +
    'echo "Node.js loader dibuat"',
    '1. Buat start-with-env.js'
  );
  await exec(conn, 'wc -l ' + PUB + '/start-with-env.js', '2. Verifikasi file');

  // 2. Update ecosystem.config.js untuk gunakan Node.js loader (bukan bash wrapper)
  const ecoContent = `// ecosystem.config.js — PM2 Config (server-side)
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
      script: './start-with-env.js',
      cwd: '${PUB}',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      node_args: '--max-old-space-size=512',
      max_memory_restart: '700M',
      restart_delay: 3000,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
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
    'cat > ' + PUB + '/ecosystem.config.js << \'ECO_EOF\'\n' + ecoContent + '\nECO_EOF\necho "ecosystem.config.js diperbarui"',
    '3. Update ecosystem.config.js'
  );

  // 3. Delete & restart frontend
  await exec(conn,
    'cd ' + PUB + ' && ' + PM2 + ' delete backone-frontend 2>/dev/null; ' +
    PM2 + ' start ecosystem.config.js --only backone-frontend && echo "START OK"',
    '4. Restart frontend dengan Node.js loader'
  );

  // 4. Tunggu startup
  await new Promise(r => setTimeout(r, 8000));

  // 5. Cek out log (harus tampil "Loaded X environment variables")
  await exec(conn, 'tail -10 ' + PUB + '/logs/frontend-out.log 2>/dev/null', '5. Out log (env loader output)');
  await exec(conn, 'tail -5 ' + PUB + '/logs/frontend-error.log 2>/dev/null', '6. Error log terbaru');

  // 6. Test agents
  await exec(conn, 'curl -sk -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:3000/agents', '7. Test /agents page');

  // 7. PM2 status
  await exec(conn, PM2 + ' list 2>/dev/null | grep backone', '8. PM2 status');

  conn.end();
  console.log('\n✅ Selesai!\n');
}

main().catch(e => console.error('[FATAL]', e.message));
