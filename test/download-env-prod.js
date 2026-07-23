module.paths.unshift('c:\\Users\\demo\\Downloads\\Deep Package Inspection\\node_modules');
const { Client } = require('ssh2');
const fs = require('fs');

const SSH = { host: '103.185.47.52', port: 2222, username: 'adminbackend', password: 'htEo7x6LsBQiEHHH', readyTimeout: 60000 };
const REMOTE_PATH = '/home/adminbackend/web/demoplace.my.id/public_html/.env.production';
const LOCAL_PATH = 'c:\\Users\\demo\\Downloads\\Deep Package Inspection\\.env.production';

async function main() {
  const conn = new Client();
  await new Promise((resolve, reject) => {
    conn.on('ready', resolve).on('error', reject).connect(SSH);
  });
  console.log('SSH connected. Downloading .env.production...');

  await new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      sftp.fastGet(REMOTE_PATH, LOCAL_PATH, {}, (err2) => {
        if (err2) return reject(err2);
        resolve();
      });
    });
  });

  console.log('Downloaded successfully to:', LOCAL_PATH);
  conn.end();
}

main().catch(console.error);
