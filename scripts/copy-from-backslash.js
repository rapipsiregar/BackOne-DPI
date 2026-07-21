// scripts/copy-from-backslash.js
// Copy file dari direktori backslash ke path yang benar
'use strict';
const { Client } = require('ssh2');
const https = require('https');

const SSH = { host: '103.185.47.52', port: 2222, username: 'adminbackend', password: 'htEo7x6LsBQiEHHH', readyTimeout: 60000 };
const PUB = '/home/adminbackend/web/demoplace.my.id/public_html';
const SA  = PUB + '/.next/standalone/.next/static';
const BSDir = PUB + '/.next\\static\\chunks'; // Backslash literal path

function exec(conn, cmd, label) {
  if (label) console.log('\n[' + label + ']');
  console.log('$ ' + cmd.substring(0, 90));
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

async function httpGet(url) {
  return new Promise(resolve => {
    const req = https.get(url, { timeout: 12000, rejectUnauthorized: false }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, size: body.length }));
    });
    req.on('error', e => resolve({ status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
  });
}

async function main() {
  const conn = new Client();
  await new Promise((r, j) => { conn.on('ready', r).on('error', j).connect(SSH); });
  console.log('[SSH] Connected\n');

  // 1. List isi direktori backslash
  await exec(conn, "ls '" + BSDir + "' | grep css | head -10", '1. CSS di direktori backslash');

  // 2. Copy semua file dari direktori backslash ke standalone/chunks
  await exec(conn,
    "cp '" + BSDir + "/'* '" + SA + "/chunks/' 2>&1 && echo 'COPY OK' || echo 'COPY PARTIAL'",
    '2. Copy semua file dari backslash dir ke standalone/chunks'
  );

  // 3. Verifikasi CSS yang hilang sudah ada
  await exec(conn,
    "ls '" + SA + "/chunks/' | grep '1oskchnhjm4n8'",
    '3. Verifikasi 1oskchnhjm4n8.css ada'
  );

  // 4. Juga cek nested static dir (ada static/static/)
  await exec(conn,
    "ls '" + SA + "/static/' 2>/dev/null | head -10 || echo 'Tidak ada nested static'",
    '4. Cek nested static dir'
  );

  // 5. Cek juga backslash css dir (beda dengan chunks)
  await exec(conn,
    "ls '" + PUB + "/.next\\static\\css' 2>/dev/null | head -10 || echo 'Tidak ada backslash css dir'",
    '5. Cek backslash css dir'
  );

  // 6. Copy CSS dari backslash css dir juga jika ada
  await exec(conn,
    "[ -d '" + PUB + "/.next\\static\\css' ] && cp '" + PUB + "/.next\\static\\css/'* '" + SA + "/css/' 2>&1 && echo 'CSS copy OK' || echo 'Tidak ada backslash css dir'",
    '6. Copy dari backslash css dir'
  );

  conn.end();

  // 7. Final test
  console.log('\n[7. Final test semua static files...]');
  await new Promise(r => setTimeout(r, 2000));
  const files = [
    '/_next/static/chunks/1oskchnhjm4n8.css',
    '/_next/static/chunks/1u6dw_tm45utz.css',
    '/_next/static/chunks/3km6z-n6wbgrs.js',
    '/_next/static/chunks/21luguo5_g2uu.js',
    '/_next/static/chunks/1-8s9_t85wwr4.js',
    '/login',
  ];
  for (const f of files) {
    const r = await httpGet('https://demoplace.my.id' + f);
    const icon = r.status === 200 ? '✅' : '❌';
    console.log('  ' + icon + ' HTTP ' + r.status + ' | ' + (r.size || 0) + ' bytes | ' + f);
  }
  console.log('\n✅ Selesai! Hard refresh browser (Ctrl+Shift+R)\n');
}

main().catch(e => console.error('[FATAL]', e.message));
