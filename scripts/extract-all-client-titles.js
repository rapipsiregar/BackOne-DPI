const SftpClient = require('ssh2-sftp-client');
const { Client } = require('ssh2');

const remoteExtractScript = `
const fs = require('fs');
const path = require('path');

const root = '/home/adminbackend/web/demoplace.my.id/public_html/.next/standalone/.next/server/chunks';

console.log('=== EXTRACTING ALL PAGE HEADERS FROM CHUNKS ===\\n');

const files = fs.readdirSync(root);
files.forEach(f => {
  if (!f.endsWith('.js')) return;
  const content = fs.readFileSync(path.join(root, f), 'utf8');
  
  // Match header titles in React JSX: e.g. text-3xl font-bold ... >TitleText<
  const titleMatches = content.matchAll(/text-3xl[^>]*>([^<]{3,40})</gi);
  for (const m of titleMatches) {
    console.log(\`Chunk \${f}: "\${m[1].trim()}"\`);
  }

  // Match tab names in React JSX
  const tabMatches = content.matchAll(/role="tab"[^>]*>([^<]{3,30})</gi);
  for (const m of tabMatches) {
    console.log(\`Chunk \${f} Tab: "\${m[1].trim()}"\`);
  }
});
`;

async function main() {
  const sftp = new SftpClient();
  await sftp.connect({
    host: '103.185.47.52',
    port: 2222,
    username: 'adminbackend',
    password: 'htEo7x6LsBQiEHHH'
  });

  const remoteScriptPath = '/home/adminbackend/extract_client_titles.js';
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
