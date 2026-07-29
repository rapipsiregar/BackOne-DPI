// scripts/find-chunks.js
// Cari di mana file chunks yang benar berada di server
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
  // 1. Cari file chunk yang direferensikan HTML
  await exec(conn, 'find ' + PUB + ' -name "3km6z-n6wbgrs.js" 2>/dev/null | head -5');
  await exec(conn, 'find ' + PUB + ' -name "21luguo5_g2uu.js" 2>/dev/null | head -5');
  await exec(conn, 'find ' + PUB + ' -name "1u6dw_tm45utz.css" 2>/dev/null | head -5');

  // 2. Cek isi static/static di standalone
  const sa = PUB + '/.next/standalone/.next/static/static';
  await exec(conn, 'ls ' + sa + '/ 2>/dev/null | head -10 || echo "Tidak ada nested static"');

  // 3. Cek BUILD_ID utama
  await exec(conn, 'cat ' + PUB + '/.next/BUILD_ID 2>/dev/null || echo "NO_BUILDID"');

  // 4. Cek build-manifest.json untuk lihat chunk names
  await exec(conn, 'cat ' + PUB + '/.next/standalone/.next/build-manifest.json 2>/dev/null | python3 -m json.tool 2>/dev/null | grep -A2 "login" | head -20');

  // 5. Cek app-path-routes-manifest
  await exec(conn, 'cat ' + PUB + '/.next/standalone/.next/app-path-routes-manifest.json 2>/dev/null | head -20');

  // 6. Cek apakah ada next.js build di parent directory
  await exec(conn, 'find /home/adminbackend -name "3km6z-n6wbgrs.js" 2>/dev/null | head -5');

  // 7. Cek total disk structure
  await exec(conn, 'du -sh ' + PUB + '/.next/standalone/.next/ 2>/dev/null');
  await exec(conn, 'du -sh ' + PUB + '/.next/ 2>/dev/null | head -5');

  conn.end();
  console.log('\nDone.');
}).connect({
  host: '103.185.47.52', port: 2222,
  username: 'adminbackend', password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 30000
});
