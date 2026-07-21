const { Client } = require('ssh2');

const remoteScript = `
const fs = require('fs');
const path = require('path');

const root = '/home/adminbackend/web/demoplace.my.id/public_html/.next/standalone/.next/server/app/(dashboard)';

function scanDir(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...scanDir(fullPath));
    } else if (item.name.endsWith('.html') || item.name.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

console.log('=== AUDITING ALL PAGE HEADERS AND TITLES ON DEMOPLACE.MY.ID ===\\n');

const files = scanDir(root);
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file);
  
  // Extract <h2> or <h1> or header titles
  const h2s = [];
  const h2Match = content.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi);
  for (const m of h2Match) {
    const clean = m[1].replace(/<[^>]+>/g, '').trim();
    if (clean && !h2s.includes(clean)) h2s.push(clean);
  }

  // Extract Learn This Page triggers
  const hasHelpTrigger = content.includes('Learn This Page');

  if (h2s.length > 0 || hasHelpTrigger) {
    console.log('Page Route File:', rel);
    if (h2s.length > 0) console.log('  Headers (H2):', h2s.join(' | '));
    console.log('  Has Learn This Page Button:', hasHelpTrigger);
    console.log('---');
  }
});
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
