const { Client } = require('ssh2');
const path = require('path');

const SSH = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 60000
};

const conn = new Client();
conn.on('ready', () => {
  conn.exec("node -e \"const fs = require('fs'); const path = require('path'); const root = '/home/adminbackend/web/demoplace.my.id/public_html'; function getFiles(dir, files = {}) { try { const list = fs.readdirSync(dir); for (const item of list) { const fullPath = path.join(dir, item); const stat = fs.statSync(fullPath); if (stat.isDirectory()) { if (item !== 'node_modules' && item !== '.next' && item !== '.git') getFiles(fullPath, files); } else { files[path.relative(root, fullPath)] = true; } } } catch(e) {} return files; } console.log(JSON.stringify(Object.keys(getFiles(path.join(root, 'src')))));\"", (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log('Remote keys:', out);
      conn.end();
    });
  });
}).connect(SSH);
