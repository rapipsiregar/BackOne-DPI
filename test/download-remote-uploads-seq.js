const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SSH_CONFIG = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH'
};

const remoteDir = '/home/adminbackend/web/demoplace.my.id/public_html/api/uploads';
const localDir = path.join(__dirname, '../public/api/uploads');

// Ensure local directory exists
if (!fs.existsSync(localDir)) {
  fs.mkdirSync(localDir, { recursive: true });
}

console.log('Connecting to SSH...');
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Connection ready. Starting SFTP...');
  conn.sftp(async (err, sftp) => {
    if (err) {
      console.error('SFTP Error:', err.message);
      conn.end();
      return;
    }

    console.log('Listing remote uploads directory:', remoteDir);
    sftp.readdir(remoteDir, async (err, list) => {
      if (err) {
        console.error('Readdir Error:', err.message);
        conn.end();
        return;
      }

      const files = list.filter(item => item.attrs.isFile());
      console.log(`Found ${files.length} upload files on remote server.`);
      
      if (files.length === 0) {
        conn.end();
        return;
      }

      // Download files sequentially using a helper function
      async function downloadFile(index) {
        if (index >= files.length) {
          console.log('\n=========================================');
          console.log('  ALL UPLOADS DOWNLOAD COMPLETED.');
          console.log('=========================================');
          conn.end();
          return;
        }

        const name = files[index].filename;
        const remoteFile = path.posix.join(remoteDir, name);
        const localFile = path.join(localDir, name);

        console.log(`[${index + 1}/${files.length}] Downloading: ${name} ...`);
        
        sftp.fastGet(remoteFile, localFile, {}, (err) => {
          if (err) {
            console.error(`Failed to download ${name}:`, err.message);
          } else {
            console.log(`✓ Completed ${name}`);
          }
          // Proceed to next file
          setTimeout(() => downloadFile(index + 1), 50);
        });
      }

      // Start the sequential download
      await downloadFile(0);
    });
  });
}).connect(SSH_CONFIG);
