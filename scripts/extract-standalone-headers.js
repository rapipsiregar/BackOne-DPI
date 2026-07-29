const SftpClient = require('ssh2-sftp-client');
const { Client } = require('ssh2');

const remoteExtractScript = `
const fs = require('fs');
const path = require('path');

const root = '/home/adminbackend/web/demoplace.my.id/public_html/.next/standalone/.next/server';

console.log('=== EXTRACTING ALL PAGE HEADERS FROM STANDALONE BUILD ===\\n');

function scan(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      scan(full);
    } else if (item.name.endsWith('.js') || item.name.endsWith('.html')) {
      const content = fs.readFileSync(full, 'utf8');
      
      // Look for H2/H1 page header titles or page metadata
      const matches = content.matchAll(/<h[12][^>]*>([\\s\\S]*?)<\\/h[12]>/gi);
      for (const m of matches) {
        const clean = m[1].replace(/<[^>]+>/g, '').trim();
        if (clean && clean.length > 2 && clean.length < 60 && !clean.includes('{') && !clean.includes('function')) {
          console.log(\`File: \${path.relative(root, full)}\`);
          console.log(\`   Header: "\${clean}"\`);
        }
      }
    }
  }
}

scan(path.join(root, 'app/(dashboard)'));
`;

async function main() {
  const sftp = new SftpClient();
  await sftp.connect({
    host: '103.185.47.52',
    port: 2222,
    username: 'adminbackend',
    password: 'htEo7x6LsBQiEHHH'
  });

  const remoteScriptPath = '/home/adminbackend/extract_standalone.js';
  await sftp.put(Buffer.from(remoteExtractScript), remoteScriptPath);
  await sftp.end();

  const conn = new Client();
  conn.on('ready', () => {
    conn.exec(`node ${remoteScriptPath}`, (err, stream) => {
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
}

main();
