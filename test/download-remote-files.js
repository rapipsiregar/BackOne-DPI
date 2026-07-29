const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs');

const SSH = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 60000
};

const REMOTE_ROOT = '/home/adminbackend/web/demoplace.my.id/public_html';
const LOCAL_ROOT = path.join(__dirname, '..');

const filesToDownload = [
  'src/app/(dashboard)/agents/page.tsx',
  'src/app/(dashboard)/apps/page.tsx',
  'src/app/(dashboard)/devices/page.tsx',
  'src/app/(dashboard)/dns/page.tsx',
  'src/app/(dashboard)/dpi-analytics/page.tsx',
  'src/app/(dashboard)/events/page.tsx',
  'src/app/(dashboard)/flows/page.tsx',
  'src/app/(dashboard)/geography/page.tsx',
  'src/app/(dashboard)/intelligence/page.tsx',
  'src/app/(dashboard)/lookup/page.tsx',
  'src/app/(dashboard)/network-infrastructure/page.tsx',
  'src/app/(dashboard)/network-intelligence/page.tsx',
  'src/app/(dashboard)/page.tsx',
  'src/app/(dashboard)/security-audit/page.tsx',
  'src/app/(dashboard)/threats/page.tsx',
  'src/components/admin/ExternalAccountModal.tsx',
  'src/components/layout/Sidebar.tsx',
  'src/components/layout/SidebarData.ts',
  'src/components/ui/SafeImage.tsx',
  'src/lib/actions/agents.ts',
  'src/lib/admin-api.ts',
  'package.json'
];

const conn = new Client();
conn.on('ready', () => {
  console.log('✓ SSH Connection ready for SFTP...');
  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP Error:', err.message);
      conn.end();
      return;
    }
    
    let downloadedCount = 0;
    let failedCount = 0;
    
    filesToDownload.forEach((relPath) => {
      const remotePath = `${REMOTE_ROOT}/${relPath}`;
      const localPath = path.join(LOCAL_ROOT, relPath);
      
      // Ensure target directory exists
      const localDir = path.dirname(localPath);
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      
      console.log(`Downloading: ${relPath} ...`);
      sftp.fastGet(remotePath, localPath, (sftpErr) => {
        if (sftpErr) {
          console.error(`✗ Failed to download ${relPath}:`, sftpErr.message);
          failedCount++;
        } else {
          console.log(`✓ Downloaded ${relPath}`);
          downloadedCount++;
        }
        
        if (downloadedCount + failedCount === filesToDownload.length) {
          console.log(`\n=========================================`);
          console.log(`  DOWNLOAD COMPLETED: ${downloadedCount} Succeeded, ${failedCount} Failed.`);
          console.log(`=========================================\n`);
          conn.end();
        }
      });
    });
  });
}).on('error', console.error).connect(SSH);
