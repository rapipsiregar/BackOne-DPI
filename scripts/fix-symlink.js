// scripts/fix-symlink.js
// Fix: Perbarui symlink _next agar menunjuk ke .next/standalone/.next
// Ini adalah penyebab utama CSS/JS tidak termuat
'use strict';

const { Client } = require('ssh2');
const https = require('https');

const SSH = {
  host: '103.185.47.52', port: 2222,
  username: 'adminbackend', password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 60000
};

function sshExec(conn, cmd, label = '') {
  if (label) console.log(`\n[${label}]`);
  console.log('$ ' + cmd.substring(0, 90) + (cmd.length > 90 ? '...' : ''));
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
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   BackOne DPI — Fix Symlink _next → standalone/.next    ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const conn = new Client();
  await new Promise((r, j) => { conn.on('ready', r).on('error', j).connect(SSH); });
  console.log('[SSH] Terhubung!\n');

  const PUB = '/home/adminbackend/web/demoplace.my.id/public_html';
  const SA  = `${PUB}/.next/standalone`;

  // 1. Verifikasi struktur standalone
  await sshExec(conn,
    `ls ${SA}/.next/static/chunks/ | grep -E "(3km6z|21luguo|1u6dw|1osk)" | head -10`,
    '1. Cek chunk files di standalone/.next'
  );

  await sshExec(conn,
    `ls ${SA}/.next/static/chunks/*.css 2>/dev/null | head -5 || echo "Cek dengan wc"`,
    '2. Cek CSS files di standalone'
  );

  await sshExec(conn,
    `ls ${SA}/.next/static/chunks/ | wc -l && echo "file di chunks"`,
    '3. Jumlah total file di chunks'
  );

  // 2. Update symlink
  await sshExec(conn,
    `rm -f ${PUB}/_next && ln -s ${SA}/.next ${PUB}/_next && echo "BERHASIL: symlink diperbaiki"`,
    '4. Update symlink _next → standalone/.next'
  );

  // 3. Verifikasi symlink baru
  await sshExec(conn,
    `ls -la ${PUB}/_next && ls ${PUB}/_next/static/chunks/ | head -5`,
    '5. Verifikasi symlink baru'
  );

  // 4. Juga update public/ symlink jika belum ada
  await sshExec(conn,
    `ls -la ${PUB}/public 2>/dev/null || echo "public/ tidak ada sebagai symlink"`,
    '6. Cek public/ directory'
  );

  // Buat symlink public → standalone/public jika ada
  await sshExec(conn,
    `[ -d ${SA}/public ] && ([ -e ${PUB}/public_sa ] || ln -s ${SA}/public ${PUB}/public_sa) && echo "standalone/public tersedia" || echo "standalone/public tidak ada"`,
    '7. Cek standalone/public'
  );

  conn.end();

  // 5. Test CSS/JS loading setelah fix
  console.log('\n[8. Test CSS/JS via domain setelah fix...]');
  await new Promise(r => setTimeout(r, 2000));

  const files = [
    '/_next/static/chunks/3km6z-n6wbgrs.js',
    '/_next/static/chunks/1u6dw_tm45utz.css',
    '/_next/static/chunks/1oskchnhjm4n8.css',
    '/_next/static/chunks/21luguo5_g2uu.js',
    '/_next/static/chunks/1-8s9_t85wwr4.js',
  ];

  for (const f of files) {
    const r = await httpGet(`https://demoplace.my.id${f}`);
    const icon = r.status === 200 ? '✅' : '❌';
    const ext = f.endsWith('.css') ? 'CSS' : 'JS ';
    console.log(`  ${icon} [${ext}] HTTP ${r.status} | ${r.size || 0} bytes | ${r.type || 'N/A'}`);
    if (r.status !== 200) console.log(`      ${f}`);
  }

  console.log('\n✅ Selesai! Lakukan HARD REFRESH (Ctrl+Shift+R) di browser.\n');
}

main().catch(err => { console.error('[FATAL]', err.message); process.exit(1); });
