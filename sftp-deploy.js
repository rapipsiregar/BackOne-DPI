// sftp-deploy.js
// Upload source2-deploy.zip ke server via SFTP menggunakan ssh2-sftp-client
// Run: node sftp-deploy.js

const SftpClient = require('ssh2-sftp-client');
const path = require('path');
const fs = require('fs');

const config = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 30000,
  retries: 2,
  retry_factor: 2,
  retry_minTimeout: 2000,
};

const LOCAL_ZIP  = path.join(__dirname, '..', 'source2-deploy.zip');
const REMOTE_DIR = '/home/adminbackend/web/dev.demoplace.my.id/public_html';
const REMOTE_ZIP = `${REMOTE_DIR}/source2-deploy.zip`;

async function deploy() {
  const sftp = new SftpClient();
  
  const zipSizeMB = (fs.statSync(LOCAL_ZIP).size / 1024 / 1024).toFixed(1);
  console.log(`[SFTP] Connecting to ${config.host}:${config.port}...`);
  console.log(`[SFTP] Local ZIP: ${LOCAL_ZIP} (${zipSizeMB} MB)`);
  console.log(`[SFTP] Remote: ${REMOTE_ZIP}`);
  
  try {
    await sftp.connect(config);
    console.log('[SFTP] Connected!');

    // Ensure remote directory exists
    const dirExists = await sftp.exists(REMOTE_DIR);
    if (!dirExists) {
      console.log(`[SFTP] Creating remote dir: ${REMOTE_DIR}`);
      await sftp.mkdir(REMOTE_DIR, true);
    }

    // Upload with progress
    console.log('[SFTP] Uploading ZIP...');
    let lastPercent = 0;
    await sftp.fastPut(LOCAL_ZIP, REMOTE_ZIP, {
      chunkSize: 131072, // 128 KB chunks
      step: (totalTransferred, chunk, total) => {
        const percent = Math.round((totalTransferred / total) * 100);
        if (percent !== lastPercent && percent % 10 === 0) {
          const mb = (totalTransferred / 1024 / 1024).toFixed(1);
          console.log(`[SFTP] Progress: ${percent}% (${mb} MB / ${(total/1024/1024).toFixed(1)} MB)`);
          lastPercent = percent;
        }
      }
    });
    
    console.log('[SFTP] ✓ Upload complete!');
    
    // Verify file exists on server
    const remoteInfo = await sftp.stat(REMOTE_ZIP);
    console.log(`[SFTP] Remote file size: ${(remoteInfo.size / 1024 / 1024).toFixed(1)} MB`);
    
    await sftp.end();
    console.log('[SFTP] Connection closed.');
    console.log('');
    console.log('=== NEXT STEPS ===');
    console.log('1. SSH to server: ssh -p 2222 adminbackend@103.185.47.52');
    console.log(`2. cd ${REMOTE_DIR}`);
    console.log('3. unzip -o source2-deploy.zip');
    console.log('4. chmod +x deploy-server-setup.sh && bash deploy-server-setup.sh');
    
  } catch (err) {
    console.error('[SFTP] ERROR:', err.message);
    try { await sftp.end(); } catch {}
    process.exit(1);
  }
}

deploy();
