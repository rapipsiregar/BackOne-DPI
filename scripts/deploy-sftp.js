// scripts/deploy-sftp.js
// ─────────────────────────────────────────────────────────────────────────────
// BackOne DPI — Production SFTP Deployment Script (Windows Compatible)
//
// Usage: node scripts/deploy-sftp.js
// Requires: npm install ssh2-sftp-client ssh2 (already in devDependencies)
//
// This script:
//   1. Verifies the production build exists (.next/standalone)
//   2. Connects to server via SFTP (port 2222)
//   3. Uploads all required files to the remote server
//   4. Runs post-deploy commands via SSH (npm install, PM2 restart)
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const SftpClient = require('ssh2-sftp-client');
const { Client: SshClient } = require('ssh2');
const path = require('path');
const fs = require('fs');

// ─── Configuration ────────────────────────────────────────────────────────────
const CONFIG = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
  remotePath: '/home/adminbackend/web/demoplace.my.id/public_html',
};

const LOCAL_ROOT = path.resolve(__dirname, '..');

// Files/dirs to upload (relative to LOCAL_ROOT)
// These are the minimum required for production deployment
const UPLOAD_MANIFEST = [
  // Next.js standalone server build output (entire .next folder with manifests and server files)
  { local: '.next/standalone', remote: '.next/standalone', type: 'dir' },

  // Next.js static assets and chunks (CRITICAL to prevent 404 chunk errors)
  { local: '.next/static', remote: '.next/static', type: 'dir' },

  // Public assets (images, icons)
  { local: 'public', remote: 'public', type: 'dir' },

  // Backend API server
  { local: 'backend/server.js', remote: 'backend/server.js', type: 'file' },
  { local: 'backend/db', remote: 'backend/db', type: 'dir' },
  { local: 'backend/middleware', remote: 'backend/middleware', type: 'dir' },
  { local: 'backend/models', remote: 'backend/models', type: 'dir' },
  { local: 'backend/routes', remote: 'backend/routes', type: 'dir' },
  { local: 'backend/deviceResolver.js', remote: 'backend/deviceResolver.js', type: 'file' },
  { local: 'backend/generate_export.js', remote: 'backend/generate_export.js', type: 'file' },
  { local: 'backend/package.json', remote: 'backend/package.json', type: 'file' },
  { local: 'backend/package-lock.json', remote: 'backend/package-lock.json', type: 'file' },

  // Proxy data collector
  { local: 'proxy/index.js', remote: 'proxy/index.js', type: 'file' },
  { local: 'proxy/collector.js', remote: 'proxy/collector.js', type: 'file' },
  { local: 'proxy/collectorHelper.js', remote: 'proxy/collectorHelper.js', type: 'file' },
  { local: 'proxy/collectorHelperDpi.js', remote: 'proxy/collectorHelperDpi.js', type: 'file' },
  { local: 'proxy/collectorHelperDpi2.js', remote: 'proxy/collectorHelperDpi2.js', type: 'file' },
  { local: 'proxy/collectorHelperDpi3.js', remote: 'proxy/collectorHelperDpi3.js', type: 'file' },
  { local: 'proxy/dataRetention.js', remote: 'proxy/dataRetention.js', type: 'file' },
  { local: 'proxy/db', remote: 'proxy/db', type: 'dir' },
  { local: 'proxy/deviceResolver.js', remote: 'proxy/deviceResolver.js', type: 'file' },
  { local: 'proxy/models', remote: 'proxy/models', type: 'dir' },
  { local: 'proxy/netifyClient.js', remote: 'proxy/netifyClient.js', type: 'file' },
  { local: 'proxy/netifyClientCore.js', remote: 'proxy/netifyClientCore.js', type: 'file' },
  { local: 'proxy/netifyClientStats.js', remote: 'proxy/netifyClientStats.js', type: 'file' },
  { local: 'proxy/netifyTelemetry.js', remote: 'proxy/netifyTelemetry.js', type: 'file' },
  { local: 'proxy/routes.js', remote: 'proxy/routes.js', type: 'file' },
  { local: 'proxy/scheduler.js', remote: 'proxy/scheduler.js', type: 'file' },
  { local: 'proxy/package.json', remote: 'proxy/package.json', type: 'file' },
  { local: 'proxy/package-lock.json', remote: 'proxy/package-lock.json', type: 'file' },

  // PM2 ecosystem config
  { local: 'ecosystem.config.js', remote: 'ecosystem.config.js', type: 'file' },

  // Database migration temporary files
  { local: 'migration-temp', remote: 'migration-temp', type: 'dir' },
  { local: 'scripts/migrate-db-remote.js', remote: 'migration-temp/migrate-db-remote.js', type: 'file' },

  // Production environment (CONFIDENTIAL — uploaded via SFTP, not git)
  { local: '.env.production', remote: '.env.production', type: 'file' },
];

// Post-deploy commands to run on server via SSH
const POST_DEPLOY_COMMANDS = [
  // Ensure required directories exist
  'mkdir -p /home/adminbackend/web/demoplace.my.id/public_html/logs',
  'mkdir -p /home/adminbackend/web/demoplace.my.id/public_html/api/uploads',
  'mkdir -p /home/adminbackend/web/demoplace.my.id/public_html/backend/uploads',
  'mkdir -p /home/adminbackend/web/demoplace.my.id/public_html/backend/public/api/uploads',

  // Set correct permissions on upload directories
  'chmod 755 /home/adminbackend/web/demoplace.my.id/public_html/api/uploads',
  'chmod 755 /home/adminbackend/web/demoplace.my.id/public_html/backend/uploads',
  'chmod 755 /home/adminbackend/web/demoplace.my.id/public_html/backend/public/api/uploads',

  // Install backend dependencies (production only)
  'cd /home/adminbackend/web/demoplace.my.id/public_html/backend && npm ci --omit=dev 2>&1 | tail -5',

  // Install proxy dependencies (production only)
  'cd /home/adminbackend/web/demoplace.my.id/public_html/proxy && npm ci --omit=dev 2>&1 | tail -5',

  // Execute database migration on remote server
  'echo "=== RUNNING REMOTE DB MIGRATION ==="',
  'node /home/adminbackend/web/demoplace.my.id/public_html/migration-temp/migrate-db-remote.js',
  'rm -rf /home/adminbackend/web/demoplace.my.id/public_html/migration-temp && echo "Cleaned up migration temporary files"',

  // Copy Next.js static assets to standalone directory (required for standalone mode)
  // Fix standalone directory structure for Next.js
  'mkdir -p /home/adminbackend/web/demoplace.my.id/public_html/.next/standalone/.next/',
  'rm -rf /home/adminbackend/web/demoplace.my.id/public_html/.next/standalone/.next/static && cp -r /home/adminbackend/web/demoplace.my.id/public_html/.next/static /home/adminbackend/web/demoplace.my.id/public_html/.next/standalone/.next/static && echo "Static assets copied to standalone"',
  'cp -r /home/adminbackend/web/demoplace.my.id/public_html/public /home/adminbackend/web/demoplace.my.id/public_html/.next/standalone/public 2>/dev/null || true',
  'ln -sfn /home/adminbackend/web/demoplace.my.id/public_html/.next/standalone/.next /home/adminbackend/web/demoplace.my.id/public_html/_next',
  'ln -sfn /home/adminbackend/web/demoplace.my.id/public_html/.next/standalone/.next/static /home/adminbackend/web/demoplace.my.id/public_html/.next/static',

  // SECURITY: Remove .env files from standalone (they should never be in the build output)
  'rm -f /home/adminbackend/web/demoplace.my.id/public_html/.next/standalone/.env.production && echo "Removed .env.production from standalone"',
  'rm -f /home/adminbackend/web/demoplace.my.id/public_html/.next/standalone/.env.local 2>/dev/null || true',

  // Check if PM2 is installed (use local install path)
  'export PM2=/home/adminbackend/.npm-global/bin/pm2 && $PM2 --version 2>&1 || (npm config set prefix /home/adminbackend/.npm-global && npm install -g pm2)',

  // Reload PM2 processes with new code (zero-downtime reload)
  'export PM2=/home/adminbackend/.npm-global/bin/pm2 && cd /home/adminbackend/web/demoplace.my.id/public_html && NODE_ENV=production $PM2 reload ecosystem.config.js 2>&1 && $PM2 restart backone-frontend --update-env 2>&1 || NODE_ENV=production $PM2 start ecosystem.config.js',

  // Save PM2 process list for auto-restart on server reboot
  '/home/adminbackend/.npm-global/bin/pm2 save',

  // Show status
  '/home/adminbackend/.npm-global/bin/pm2 list',

  // Test health endpoints
  'sleep 5 && curl -s http://127.0.0.1:3001/api/health || echo "Backend not ready yet"',
];

// ─── Helper: Upload a directory recursively ───────────────────────────────────
async function uploadDirectory(sftp, localDir, remoteDir, options = {}) {
  const localPath = path.join(LOCAL_ROOT, localDir);
  if (!fs.existsSync(localPath)) {
    console.log(`  [SKIP] ${localDir} — does not exist locally`);
    return;
  }

  // Ensure remote directory exists
  try {
    await sftp.mkdir(path.posix.join(CONFIG.remotePath, remoteDir), true);
  } catch {
    // Directory may already exist
  }

  const items = fs.readdirSync(localPath, { withFileTypes: true });
  for (const item of items) {
    // Only exclude .next and node_modules at the TOP level of the project root.
    // Inside .next/standalone/, the .next subdir contains build artifacts and MUST be uploaded.
    // node_modules inside standalone are also needed (pruned deps) — skip them; server handles npm ci.
    const isTopLevel = !localDir.includes('standalone');
    if (isTopLevel && ['node_modules', '.git', '.next'].includes(item.name)) continue;
    if (!isTopLevel && ['node_modules', '.git'].includes(item.name)) continue;
    // Skip log files
    if (item.name.endsWith('.log')) continue;
    // Skip local env file from standalone (security — should not be on server in build)
    if (item.name === '.env.production' || item.name === '.env.local') continue;

    const localItemPath = path.join(localPath, item.name);
    // Force forward slashes for remote Linux path compatibility
    const remoteDirNormalized = remoteDir.replace(/\\/g, '/');
    const remoteItemPath = path.posix.join(CONFIG.remotePath, remoteDirNormalized, item.name);

    if (item.isDirectory()) {
      try {
        await sftp.mkdir(remoteItemPath, true);
      } catch {
        // Ignore if exists
      }
      await uploadDirectory(sftp, path.join(localDir, item.name), path.join(remoteDir, item.name), options);
    } else {
      const displayPath = path.posix.join(remoteDirNormalized, item.name);
      process.stdout.write(`  [UP] ${displayPath} ... `);
      await sftp.put(localItemPath, remoteItemPath);
      process.stdout.write('done\n');
    }
  }
}

// ─── Helper: Run SSH commands ─────────────────────────────────────────────────
function runSshCommands(commands) {
  return new Promise((resolve, reject) => {
    const ssh = new SshClient();
    const results = [];

    ssh.on('ready', () => {
      console.log('\n[SSH] Connected. Running post-deploy commands...\n');

      let commandIndex = 0;

      function runNext() {
        if (commandIndex >= commands.length) {
          ssh.end();
          return;
        }

        const cmd = commands[commandIndex++];
        console.log(`\n  $ ${cmd}`);

        ssh.exec(cmd, (err, stream) => {
          if (err) {
            console.error(`  [ERROR] ${err.message}`);
            runNext();
            return;
          }

          let output = '';
          stream.on('data', (data) => {
            output += data;
            process.stdout.write(data.toString());
          });
          stream.stderr.on('data', (data) => {
            process.stdout.write(`  [stderr] ${data}`);
          });
          stream.on('close', () => {
            results.push({ cmd, output });
            runNext();
          });
        });
      }

      runNext();

      ssh.on('end', () => resolve(results));
    });

    ssh.on('error', reject);

    ssh.connect({
      host: CONFIG.host,
      port: CONFIG.port,
      username: CONFIG.username,
      password: CONFIG.password,
      readyTimeout: 90000,
    });
  });
}

// ─── Main Deployment Function ─────────────────────────────────────────────────
async function deploy() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     BackOne DPI — Production Deployment Script         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Pre-flight check: verify .next/standalone exists
  const standaloneDir = path.join(LOCAL_ROOT, '.next', 'standalone');
  if (!fs.existsSync(standaloneDir)) {
    console.error('✗ ERROR: .next/standalone not found!');
    console.error('  Run: npm run build');
    console.error('  Then re-run this deployment script.\n');
    process.exit(1);
  }

  // Pre-flight check: verify .env.production exists
  const envProd = path.join(LOCAL_ROOT, '.env.production');
  if (!fs.existsSync(envProd)) {
    console.error('✗ ERROR: .env.production not found!');
    process.exit(1);
  }

  console.log(`[Config] Host     : ${CONFIG.host}:${CONFIG.port}`);
  console.log(`[Config] User     : ${CONFIG.username}`);
  console.log(`[Config] Remote   : ${CONFIG.remotePath}`);
  console.log(`[Config] Files    : ${UPLOAD_MANIFEST.length} items to upload\n`);

  // ─── Phase 1: SFTP Upload ─────────────────────────────────────────────────
  const sftp = new SftpClient();
  try {
    console.log('[SFTP] Connecting...');
    await sftp.connect({
      host: CONFIG.host,
      port: CONFIG.port,
      username: CONFIG.username,
      password: CONFIG.password,
      readyTimeout: 90000,
    });
    console.log('[SFTP] Connected!\n');

    // Ensure remote root exists
    try {
      await sftp.mkdir(CONFIG.remotePath, true);
    } catch {
      // Already exists
    }

    let uploaded = 0;
    let skipped = 0;

    for (const item of UPLOAD_MANIFEST) {
      const localPath = path.join(LOCAL_ROOT, item.local);

      if (!fs.existsSync(localPath)) {
        console.log(`[SKIP] ${item.local} — not found locally`);
        skipped++;
        continue;
      }

      if (item.type === 'dir') {
        console.log(`\n[DIR]  Uploading ${item.local}/`);
        await uploadDirectory(sftp, item.local, item.remote);
        uploaded++;
      } else {
        const remotePath = path.posix.join(CONFIG.remotePath, item.remote);
        // Ensure parent directory exists
        const remoteDir = remotePath.substring(0, remotePath.lastIndexOf('/'));
        try {
          await sftp.mkdir(remoteDir, true);
        } catch {
          // Ignore
        }
        console.log(`[FILE] ${item.local}`);
        await sftp.put(localPath, remotePath);
        uploaded++;
      }
    }

    console.log(`\n[SFTP] Upload complete! ${uploaded} items uploaded, ${skipped} skipped.`);
    await sftp.end();
  } catch (err) {
    console.error('\n[SFTP] ERROR:', err.message);
    try { await sftp.end(); } catch { /* ignore */ }
    process.exit(1);
  }

  // ─── Phase 2: SSH Post-Deploy Commands ───────────────────────────────────
  try {
    await runSshCommands(POST_DEPLOY_COMMANDS);
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║        ✅ Deployment Complete!                         ║');
    console.log('║                                                        ║');
    console.log('║  Dashboard : https://demoplace.my.id                  ║');
    console.log('║  Health    : http://127.0.0.1:3001/api/health          ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
  } catch (err) {
    console.error('\n[SSH] ERROR:', err.message);
    process.exit(1);
  }
}

// Run
deploy().catch((err) => {
  console.error('\n[DEPLOY] Fatal error:', err);
  process.exit(1);
});
