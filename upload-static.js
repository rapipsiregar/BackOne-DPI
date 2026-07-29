// upload-static.js — Upload .next/static/ ke server agar nginx serve langsung
const SftpClient = require('ssh2-sftp-client');
const path = require('path');
const fs = require('fs');

const SSH_CONFIG = {
  host: '103.185.47.52', port: 2222,
  username: 'adminbackend', password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 30000,
};

const LOCAL_STATIC  = path.join(__dirname, '.next', 'static');
const REMOTE_STATIC = '/home/adminbackend/web/dev.demoplace.my.id/public_html/_next/static';

async function uploadDir(sftp, localDir, remoteDir) {
  // Ensure remote dir exists
  await sftp.mkdir(remoteDir, true).catch(() => {});
  
  const entries = fs.readdirSync(localDir, { withFileTypes: true });
  let count = 0;
  
  for (const entry of entries) {
    const localPath  = path.join(localDir, entry.name);
    const remotePath = `${remoteDir}/${entry.name}`;
    
    if (entry.isDirectory()) {
      count += await uploadDir(sftp, localPath, remotePath);
    } else {
      await sftp.put(localPath, remotePath);
      count++;
      if (count % 20 === 0) process.stdout.write(`  ${count} files uploaded...\r`);
    }
  }
  return count;
}

async function main() {
  console.log(`[1] Local:  ${LOCAL_STATIC}`);
  console.log(`[2] Remote: ${REMOTE_STATIC}`);
  
  const files = fs.readdirSync(LOCAL_STATIC, { recursive: true }).length;
  console.log(`[3] Files to upload: ~${files}`);
  
  const sftp = new SftpClient();
  await sftp.connect(SSH_CONFIG);
  
  console.log('[4] Uploading...');
  const start = Date.now();
  const count = await uploadDir(sftp, LOCAL_STATIC, REMOTE_STATIC);
  const secs = ((Date.now() - start) / 1000).toFixed(1);
  
  await sftp.end();
  console.log(`\n[5] ✓ Uploaded ${count} files in ${secs}s`);
  console.log('\n✅ Static assets uploaded! CSS/JS sekarang bisa di-serve nginx langsung.');
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
