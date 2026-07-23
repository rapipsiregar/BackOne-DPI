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
  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP Error:', err.message);
      conn.end();
      return;
    }

    console.log('Listing remote uploads directory:', remoteDir);
    sftp.readdir(remoteDir, (err, list) => {
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

      let downloaded = 0;
      files.forEach(fileInfo => {
        const name = fileInfo.filename;
        const remoteFile = path.posix.join(remoteDir, name);
        const localFile = path.join(localDir, name);
        
        console.log(`Downloading: ${name} ...`);
        sftp.fastGet(remoteFile, localFile, {}, (err) => {
          if (err) {
            console.error(`Failed to download ${name}:`, err.message);
          } else {
            console.log(`✓ Downloaded ${name}`);
          }
          downloaded++;
          if (downloaded === files.length) {
            console.log('\n=========================================');
            console.log('  ALL UPLOADS DOWNLOAD COMPLETED.');
            console.log('=========================================');
            conn.end();
          }
        });
      });
    });
  });
}).connect(SSH_CONFIG);
