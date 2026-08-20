// scripts/deploy-sftp.js
// ─────────────────────────────────────────────────────────────────────────────
// Next.js Production Build SFTP Deployment Script
// ─────────────────────────────────────────────────────────────────────────────

const path = require('path');
const fs = require('fs');
const Client = require('ssh2-sftp-client');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.production') });

const UPLOAD_MANIFEST = [
  { local: '.next/static', remote: '/var/www/backone/frontend/.next/static' },
  { local: '.next/server', remote: '/var/www/backone/frontend/.next/server' },
  { local: 'public', remote: '/var/www/backone/frontend/public' }
];

async function deploy() {
  const sftp = new Client();
  try {
    const config = {
      host: process.env.SFTP_HOST || '127.0.0.1',
      port: parseInt(process.env.SFTP_PORT || '22'),
      username: process.env.SFTP_USERNAME || 'deploy',
      password: process.env.SFTP_PASSWORD || 'password'
    };

    console.log(`Connecting to SFTP server ${config.host}...`);
    await sftp.connect(config);
    console.log('Connected! Starting upload...');

    for (const item of UPLOAD_MANIFEST) {
      const localPath = path.join(__dirname, '..', item.local);
      if (fs.existsSync(localPath)) {
        console.log(`Uploading ${item.local} to ${item.remote}...`);
        await sftp.uploadDir(localPath, item.remote);
      } else {
        console.warn(`Local path ${item.local} does not exist. Skipping.`);
      }
    }
    console.log('Deployment successful!');
  } catch (err) {
    console.error('Deployment failed:', err.message);
  } finally {
    await sftp.end();
  }
}

if (require.main === module) {
  deploy();
}

module.exports = { UPLOAD_MANIFEST, deploy };
