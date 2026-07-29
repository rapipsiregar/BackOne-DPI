// scripts/fix-missing-css.js
'use strict';
const { Client } = require('ssh2');
const https = require('https');

const SSH = { host: '103.185.47.52', port: 2222, username: 'adminbackend', password: 'htEo7x6LsBQiEHHH', readyTimeout: 60000 };
const PUB = '/home/adminbackend/web/demoplace.my.id/public_html';
const SA  = PUB + '/.next/standalone/.next/static';
const BP  = '/home/adminbackend/backone-production/.next/static';

function exec(conn, cmd, label) {
  if (label) console.log('\n[' + label + ']');
  console.log('$ ' + cmd.substring(0, 80));
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
      res.on('end', () => resolve({ status: res.statusCode, size: body.length, type: res.headers['content-type'] }));
    });
    req.on('error', e => resolve({ status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
  });
}

async function main() {
  const conn = new Client();
  await new Promise((r, j) => { conn.on('ready', r).on('error', j).connect(SSH); });
  console.log('[SSH] Connected\n');

  // 1. Cari file CSS yang hilang
  await exec(conn, 'find /home/adminbackend -name "1oskchnhjm4n8.css" 2>/dev/null | head -5', '1. Cari CSS hilang');

  // 2. List CSS di backone-production
  await exec(conn, 'find ' + BP + ' -name "*.css" 2>/dev/null | head -10', '2. CSS di backone-production');

  // 3. Full rsync chunks (paksa semua file)
  await exec(conn,
    'rsync -av ' + BP + '/chunks/ ' + SA + '/chunks/ 2>&1 | grep "css\\|sent\\|total" | head -10',
    '3. Full rsync chunks'
  );

  // 4. Verifikasi CSS setelah rsync
  await exec(conn, 'find ' + SA + '/chunks -name "*.css" 2>/dev/null', '4. CSS di standalone setelah rsync');

  // 5. Cek total file
  await exec(conn, 'ls ' + SA + '/chunks/ | wc -l', '5. Total file chunks');

  conn.end();

  // 6. Final test
  console.log('\n[6. Final test static files...]');
  await new Promise(r => setTimeout(r, 2000));
  const files = [
    '/_next/static/chunks/3km6z-n6wbgrs.js',
    '/_next/static/chunks/1u6dw_tm45utz.css',
    '/_next/static/chunks/1oskchnhjm4n8.css',
    '/_next/static/chunks/21luguo5_g2uu.js',
    '/_next/static/chunks/1-8s9_t85wwr4.js',
    '/_next/static/chunks/2n6j37owj-kaf.js',
  ];
  let allOk = true;
  for (const f of files) {
    const r = await httpGet('https://demoplace.my.id' + f);
    const icon = r.status === 200 ? '✅' : '❌';
    const ext = f.endsWith('.css') ? 'CSS' : 'JS ';
    console.log('  ' + icon + ' [' + ext + '] HTTP ' + r.status + ' | ' + (r.size || 0) + ' bytes');
    if (r.status !== 200) { console.log('       → ' + f); allOk = false; }
  }
  if (allOk) {
    console.log('\n🎉 SEMUA CSS/JS BERHASIL! Lakukan hard refresh (Ctrl+Shift+R)\n');
  } else {
    console.log('\n⚠ Masih ada yang 404. Cek manual.\n');
  }
}

main().catch(e => console.error('[FATAL]', e.message));
