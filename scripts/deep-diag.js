// scripts/deep-diag.js
'use strict';
const { Client } = require('ssh2');
const conn = new Client();
const PUB = '/home/adminbackend/web/demoplace.my.id/public_html';

function exec(conn, cmd) {
  console.log('\n$ ' + cmd.substring(0, 80));
  return new Promise(resolve => {
    conn.exec(cmd, (err, s) => {
      if (err) { resolve(''); return; }
      let out = '';
      s.on('data', d => { out += d; process.stdout.write(d.toString()); })
       .stderr.on('data', d => { out += d; process.stdout.write(d.toString()); })
       .on('close', () => resolve(out));
    });
  });
}

conn.on('ready', async () => {
  // 1. Cek proses yang sedang berjalan
  await exec(conn, 'ps -p 3193322 -o cmd 2>/dev/null | tail -1');

  // 2. Cek BUILD_ID di standalone
  const saPath = PUB + '/.next/standalone';
  await exec(conn, 'cat ' + saPath + '/.next/BUILD_ID 2>/dev/null || echo NO_BUILD_ID_IN_STANDALONE');

  // 3. List chunks di standalone
  await exec(conn, 'ls ' + saPath + '/.next/static/chunks/ | head -15');

  // 4. List static root di standalone
  await exec(conn, 'ls ' + saPath + '/.next/static/');

  // 5. Cek apakah ada server.js lain yang mungkin sedang berjalan
  await exec(conn, 'ps aux | grep "node.*server" | grep -v grep | head -5');

  // 6. PM2 info untuk backone-frontend
  await exec(conn, '/home/adminbackend/.npm-global/bin/pm2 show backone-frontend 2>/dev/null | grep -E "(script|cwd|pid|restart)"');

  // 7. Cek log terbaru
  await exec(conn, 'tail -20 ' + PUB + '/logs/frontend-out.log 2>/dev/null | head -20');

  conn.end();
}).connect({
  host: '103.185.47.52', port: 2222,
  username: 'adminbackend', password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 30000
});
