// scripts/check-static-files.js
// Cek apakah static chunk files ada di disk dan bisa diakses via domain
'use strict';

const { Client } = require('ssh2');
const https = require('https');

const SSH = {
  host: '103.185.47.52', port: 2222,
  username: 'adminbackend', password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 60000
};

function sshExec(conn, cmd) {
  return new Promise(resolve => {
    conn.exec(cmd, (err, s) => {
      if (err) { resolve('SSH_ERROR'); return; }
      let out = '';
      s.on('data', d => { out += d; process.stdout.write(d.toString()); })
       .stderr.on('data', d => { out += d; process.stdout.write(d.toString()); })
       .on('close', () => resolve(out));
    });
  });
}

function httpGet(url) {
  return new Promise(resolve => {
    const req = https.get(url, { timeout: 10000, rejectUnauthorized: false }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, type: res.headers['content-type'], size: body.length }));
    });
    req.on('error', e => resolve({ status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
  });
}

async function main() {
  const conn = new Client();
  await new Promise((r, j) => { conn.on('ready', r).on('error', j).connect(SSH); });
  console.log('[SSH] Connected\n');

  const PUB = '/home/adminbackend/web/demoplace.my.id/public_html';

  // 1. List chunks directory
  console.log('=== .next/static/chunks/ contents ===');
  await sshExec(conn, `ls -la ${PUB}/.next/static/chunks/ | head -20`);

  // 2. Cek CSS files yang direferensikan oleh HTML
  console.log('\n=== Cek file CSS spesifik ===');
  await sshExec(conn, `ls -la ${PUB}/.next/static/chunks/*.css 2>/dev/null | head -5 || echo "Tidak ada .css di chunks/"`);

  // 3. Cek apakah JS bootstrap file ada
  console.log('\n=== Cek file JS yang diperlukan ===');
  await sshExec(conn, `ls ${PUB}/.next/static/chunks/ | grep -E "(3km6z|21luguo|1-8s9)" | head -10 || echo "File JS tidak ditemukan"`);

  // 4. Test akses static file via domain (dari dalam server)
  console.log('\n=== Test static file via Apache ===');
  await sshExec(conn,
    `curl -sk -D - https://demoplace.my.id/_next/static/chunks/3km6z-n6wbgrs.js 2>/dev/null | head -15 || ` +
    `curl -sk -D - http://103.185.47.52:8080/_next/static/chunks/3km6z-n6wbgrs.js 2>/dev/null | head -15`
  );

  // 5. Test apakah Nginx melayani file static langsung
  console.log('\n=== Cek Nginx serving static (port 443) ===');
  await sshExec(conn,
    `curl -sk -w "\\nHTTP: %{http_code} | Type: %{content_type} | Size: %{size_download}" ` +
    `-o /dev/null https://demoplace.my.id/_next/static/chunks/3km6z-n6wbgrs.js`
  );

  // 6. Cek apakah ada .next/server/ directory
  console.log('\n=== Status .next/server/ ===');
  await sshExec(conn, `ls ${PUB}/.next/server/ 2>/dev/null | head -5 || echo ".next/server/ TIDAK ADA - standalone build mungkin tidak lengkap"`);

  conn.end();

  // 7. Test dari luar - JS dan CSS
  console.log('\n=== Test static resources dari luar ===');
  const files = [
    '/_next/static/chunks/3km6z-n6wbgrs.js',
    '/_next/static/chunks/1u6dw_tm45utz.css',
    '/_next/static/chunks/1oskchnhjm4n8.css',
    '/_next/static/chunks/21luguo5_g2uu.js',
  ];

  for (const f of files) {
    const r = await httpGet(`https://demoplace.my.id${f}`);
    const icon = r.status === 200 ? '✅' : '❌';
    console.log(`  ${icon} ${f}`);
    console.log(`     HTTP ${r.status} | Type: ${r.type || 'N/A'} | Size: ${r.size || 0} bytes`);
  }
}

main().catch(err => console.error('[FATAL]', err.message));
