const SftpClient = require('ssh2-sftp-client');
const { Client } = require('ssh2');

const remoteAuditScript = `
const fs = require('fs');
const path = require('path');

const root = '/home/adminbackend/web/demoplace.my.id/public_html';

console.log('====================================================');
console.log('   FULL COMPONENT & PAGE AUDIT OF DEMOPLACE.MY.ID   ');
console.log('====================================================');

// 1. Audit Client/Server Chunks for Page Headers & HelpTriggers
const chunksDir = path.join(root, '.next/standalone/.next/server/chunks');
if (fs.existsSync(chunksDir)) {
  const files = fs.readdirSync(chunksDir);
  files.forEach(f => {
    if (!f.endsWith('.js')) return;
    const content = fs.readFileSync(path.join(chunksDir, f), 'utf8');
    
    // Look for page headers or title definitions
    const headerMatch = content.match(/["']([A-Z][A-Za-z0-9\\s]{3,35})["'],\\s*description:/);
    if (headerMatch) {
      console.log(\`[Chunk \${f}] Found Header Definition: "\${headerMatch[1]}"\`);
    }

    if (content.includes('Learn This Page')) {
      console.log(\`[Chunk \${f}] Contains "Learn This Page" button\`);
    }
  });
}

// 2. Audit Page Source files in src/app/(dashboard)
const appSrcDir = path.join(root, 'src/app/(dashboard)');
if (fs.existsSync(appSrcDir)) {
  function scan(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        scan(full);
      } else if (item.name === 'page.tsx' || item.name.endsWith('.tsx')) {
        const content = fs.readFileSync(full, 'utf8');
        const rel = path.relative(appSrcDir, full);
        
        // Find H2 or H1
        const h2 = content.match(/<h[12][^>]*>([\\s\\S]*?)<\\/h[12]>/i);
        const titleText = h2 ? h2[1].replace(/<[^>]+>/g, '').trim().split('\\n')[0] : 'None';
        const hasHelp = content.includes('HelpTrigger') || content.includes('Learn This Page');

        console.log(\`Page File: \${rel}\`);
        console.log(\`  Header Title  : \${titleText}\`);
        console.log(\`  Has HelpButton: \${hasHelp}\`);
        console.log('----------------------------------------------------');
      }
    }
  }
  scan(appSrcDir);
}
`;

async function main() {
  const sftp = new SftpClient();
  await sftp.connect({
    host: '103.185.47.52',
    port: 2222,
    username: 'adminbackend',
    password: 'htEo7x6LsBQiEHHH'
  });

  const remoteScriptPath = '/home/adminbackend/audit_remote.js';
  await sftp.put(Buffer.from(remoteAuditScript), remoteScriptPath);
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
