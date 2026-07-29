const { Client } = require('ssh2');
const fs = require('fs');

const remoteScript = `
const fs = require('fs');
const path = require('path');

const root = '/home/adminbackend/web/demoplace.my.id/public_html';

console.log('=== 1. LOGOS & IMAGES IN PUBLIC ===');
try {
  const publicFiles = fs.readdirSync(path.join(root, 'public'));
  console.log('Files in public/:', publicFiles);
} catch(e) { console.log('Err:', e.message); }

console.log('\\n=== 2. AUDITING NAVIGATION GROUPS IN STANDALONE CHUNKS ===');
const chunksDir = path.join(root, '.next/standalone/.next/server/chunks');
if (fs.existsSync(chunksDir)) {
  const files = fs.readdirSync(chunksDir);
  files.forEach(f => {
    if (!f.endsWith('.js')) return;
    const content = fs.readFileSync(path.join(chunksDir, f), 'utf8');
    if (content.includes('Overview Dashboard') || content.includes('Network Topology')) {
      console.log('Chunk File:', f);
      const match = content.match(/title:\"OVERVIEW\".*?title:\"SECURITY & ALERTS\".*?\]/);
      if (match) {
        console.log('NAV MATCH:', match[0]);
      }
    }
  });
}

console.log('\\n=== 3. APP ROUTE DIRECTORIES ===');
try {
  const appDir = path.join(root, '.next/standalone/.next/server/app/(dashboard)');
  if (fs.existsSync(appDir)) {
    console.log('Dashboard routes in .next/standalone:', fs.readdirSync(appDir));
  }
} catch(e) { console.log('Err app dir:', e.message); }
`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`node -e ${JSON.stringify(remoteScript)}`, (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log(out);
      conn.end();
    });
  });
}).connect({
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH'
});
