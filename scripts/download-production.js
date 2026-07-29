// scripts/download-production.js
'use strict';

const SftpClient = require('ssh2-sftp-client');
const path = require('path');
const fs = require('fs');

const CONFIG = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
  remotePath: '/home/adminbackend/web/demoplace.my.id/public_html',
};

const LOCAL_ROOT = path.resolve(__dirname, '..');

const DIRS_TO_DOWNLOAD = ['src', 'backend', 'proxy', 'public', 'scripts'];
const FILES_TO_DOWNLOAD = [
  'package.json',
  'package-lock.json',
  'next.config.ts',
  'postcss.config.mjs',
  'tsconfig.json',
  'eslint.config.mjs',
  'README.md',
  'SKILLS.md',
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.prod.yml',
  'ecosystem.config.js',
  'deploy.sh'
];

async function main() {
  const sftp = new SftpClient();
  try {
    console.log(`[SFTP] Connecting to ${CONFIG.host}:${CONFIG.port}...`);
    await sftp.connect({
      host: CONFIG.host,
      port: CONFIG.port,
      username: CONFIG.username,
      password: CONFIG.password,
    });
    console.log('[SFTP] Connected successfully.');

    // 1. Download directories recursively
    for (const dirName of DIRS_TO_DOWNLOAD) {
      const remoteDir = `${CONFIG.remotePath}/${dirName}`;
      const localDir = path.join(LOCAL_ROOT, dirName);

      if (await sftp.exists(remoteDir)) {
        console.log(`[SFTP] Downloading directory: ${dirName}...`);
        fs.mkdirSync(localDir, { recursive: true });
        await sftp.downloadDir(remoteDir, localDir, {
          filter: (filePath, isDir) => {
            const basename = path.basename(filePath);
            return !['node_modules', '.next', '.git', 'logs', 'repo.zip'].includes(basename);
          }
        });
        console.log(`[SFTP] Finished downloading directory: ${dirName}`);
      } else {
        console.warn(`[SFTP] Remote directory not found: ${remoteDir}`);
      }
    }

    // 2. Download specific root files
    for (const fileName of FILES_TO_DOWNLOAD) {
      const remoteFile = `${CONFIG.remotePath}/${fileName}`;
      const localFile = path.join(LOCAL_ROOT, fileName);

      if (await sftp.exists(remoteFile)) {
        console.log(`[SFTP] Downloading file: ${fileName}...`);
        await sftp.fastGet(remoteFile, localFile);
        console.log(`[SFTP] Downloaded: ${fileName}`);
      } else {
        console.warn(`[SFTP] Remote file not found: ${remoteFile}`);
      }
    }

    console.log('\n✅ [SFTP] Download of production codebase (10/10) completed successfully!');
  } catch (err) {
    console.error('❌ [SFTP] Download failed:', err);
    process.exit(1);
  } finally {
    await sftp.end();
  }
}

main();
