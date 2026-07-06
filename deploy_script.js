const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const deployZipPath = 'd:\\\\FILE\\\\Magang\\\\Deep Package Inspection\\\\deploy.zip';
const remotePath = '/home/adminbackend/web/backend.demoplace.my.id/public_html/deploy.zip';
const remoteDir = '/home/adminbackend/web/backend.demoplace.my.id/public_html';

console.log('Connecting to SSH...');
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    console.log('Uploading deploy.zip to', remotePath);
    sftp.fastPut(deployZipPath, remotePath, (err) => {
      if (err) throw err;
      console.log('Upload complete.');
      
      console.log('Extracting and installing...');
      // Execute extraction and npm install
      const commands = `
        cd ${remoteDir}
        export PATH=/home/adminbackend/node22/bin:$PATH
        unzip -o deploy.zip
        npm install --legacy-peer-deps
        npm run build
        npm install pm2
        npx pm2 stop backone-dashboard || true
        npx pm2 delete backone-dashboard || true
        npx pm2 start npm --name "backone-dashboard" -- run start:prod
        npx pm2 save
      `;
      conn.exec(commands, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
          console.log('Deployment commands executed. Exit code:', code);
          conn.end();
        }).on('data', (data) => {
          process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
          process.stderr.write(data.toString());
        });
      });
    });
  });
}).connect({
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH'
});
