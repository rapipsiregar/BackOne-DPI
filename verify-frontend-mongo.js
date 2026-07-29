// verify-frontend-mongo.js — Trigger dashboard request lalu cek log frontend
const https = require('https');
const { Client } = require('ssh2');

const SSH_CONFIG = {
  host: '103.185.47.52', port: 2222,
  username: 'adminbackend', password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 20000,
};

const BASE = 'https://dev.demoplace.my.id';
let COOKIES = '';

function req(path, body) {
  return new Promise((resolve) => {
    const method = body ? 'POST' : 'GET';
    const bd = body ? JSON.stringify(body) : null;
    const urlObj = new URL(`${BASE}${path}`);
    const opts = {
      hostname: urlObj.hostname, port: 443,
      path: urlObj.pathname + urlObj.search, method,
      headers: {
        'Content-Type': 'application/json', 'Accept': 'text/html,application/json',
        ...(COOKIES ? { 'Cookie': COOKIES } : {}),
        ...(bd ? { 'Content-Length': Buffer.byteLength(bd) } : {}),
      },
      rejectUnauthorized: false, timeout: 30000,
    };
    const r = https.request(opts, (res) => {
      const cc = res.headers['set-cookie'];
      if (cc) COOKIES = cc.map(c => c.split(';')[0]).join('; ');
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    r.on('error', e => resolve({ status: 0, body: e.message }));
    r.on('timeout', () => { r.destroy(); resolve({ status: 0, body: 'timeout' }); });
    if (bd) r.write(bd);
    r.end();
  });
}

async function checkLogs() {
  return new Promise((resolve, reject) => {
    const SCRIPT = `
export PATH="$HOME/.npm-global/bin:$PATH"
PM2="$HOME/.npm-global/bin/pm2"
DIR="/home/adminbackend/web/dev.demoplace.my.id/public_html"

echo "=== Frontend logs after restart (last 25 lines) ==="
$PM2 logs source2-frontend --lines 25 --nostream 2>/dev/null | tail -30

echo ""
echo "=== Frontend error.log last 15 lines ==="
tail -15 $DIR/logs/frontend-error.log 2>/dev/null
`;
    const conn = new Client();
    conn.on('ready', () => {
      conn.exec(`bash -c '${SCRIPT.replace(/'/g, "'\"'\"'")}'`, (err, stream) => {
        if (err) return reject(err);
        let out = '';
        stream.on('close', () => { conn.end(); resolve(out); });
        stream.on('data', d => { out += d.toString(); process.stdout.write(d.toString()); });
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
      });
    });
    conn.on('error', reject);
    conn.connect(SSH_CONFIG);
  });
}

async function main() {
  console.log('[1] Login...');
  const lr = await req('/api/auth/login', { username: 'admin', password: 'admin' });
  console.log(`    HTTP ${lr.status} | Cookie: ${COOKIES ? 'YES' : 'NO'}`);

  console.log('\n[2] Request dashboard pages to trigger Server Components...');
  const pages = ['/', '/agents', '/flows', '/threats'];
  for (const p of pages) {
    const r = await req(p);
    const isHtml = r.body?.startsWith('<!DOCTYPE') || r.body?.includes('<html');
    const hasError = r.body?.includes('Server Components render') || r.body?.includes('An error occurred');
    console.log(`    ${r.status === 200 && !hasError ? '✅' : '❌'} ${p}: HTTP ${r.status} | HTML: ${isHtml} | SC Error: ${hasError}`);
  }

  console.log('\n[3] Checking frontend logs for new MONGODB_URI...\n');
  await checkLogs();
}

main().catch(console.error);
