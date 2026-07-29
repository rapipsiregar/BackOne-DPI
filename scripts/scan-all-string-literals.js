const SftpClient = require('ssh2-sftp-client');
const { Client } = require('ssh2');

const remoteScanScript = `
const fs = require('fs');
const path = require('path');

const root = '/home/adminbackend/web/demoplace.my.id/public_html/.next';

const targetTitles = [
  'Overview Dashboard',
  'Summary Overview',
  'DPI MetaData',
  'BackOne Metadata',
  'Network Topology',
  'Network Infrastructure',
  'Traffic Categories',
  'Threat Intelligence',
  'Detected Threats',
  'App Lookup',
  'Application Database',
  'Encryption Audit',
  'Security & Encryption Audit'
];

console.log('=== MATCHING TARGET TITLES IN REMOTE NEXT BUILD ===\\n');

function scan(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      scan(full);
    } else if (item.name.endsWith('.js') || item.name.endsWith('.html')) {
      const content = fs.readFileSync(full, 'utf8');
      targetTitles.forEach(t => {
        if (content.includes(t)) {
          console.log(\`Found "\${t}" in file: \${path.relative(root, full)}\`);
        }
      });
    }
  }
}

scan(root);
`;

async function main() {
  const sftp = new SftpClient();
  await sftp.connect({
    host: '103.185.47.52',
    port: 2222,
    username: 'adminbackend',
    password: 'htEo7x6LsBQiEHHH'
  });

  const remoteScriptPath = '/home/adminbackend/scan_strings.js';
  await sftp.put(Buffer.from(remoteScanScript), remoteScriptPath);
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
