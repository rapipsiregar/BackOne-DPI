// scripts/fix-static-paths.js
// Menyalin static files dari backone-production ke standalone yang benar
// Masalah: Upload Windows membuat direktori dengan backslash literal di Linux
'use strict';

const { Client } = require('ssh2');
const https = require('https');

const SSH = {
  host: '103.185.47.52', port: 2222,
  username: 'adminbackend', password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 60000
};

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
      res.on('end', () => resolve({ status: res.statusCode, size: body.length, type: res.headers['content-type'] }));
    });
    req.on('error', e => resolve({ status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
  });
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   BackOne DPI — Fix Static Paths (Windows Backslash)    ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const conn = new Client();
  await new Promise((r, j) => { conn.on('ready', r).on('error', j).connect(SSH); });
  console.log('[SSH] Terhubung!\n');

  const BP   = '/home/adminbackend/backone-production';
  const SA   = '/home/adminbackend/web/demoplace.my.id/public_html/.next/standalone';
  const PUB  = '/home/adminbackend/web/demoplace.my.id/public_html';

  // 1. Cek BUILD_ID di backone-production
  await exec(conn, 'cat ' + BP + '/.next/BUILD_ID 2>/dev/null || echo "NO_BUILDID"', '1. BUILD_ID backone-production');

  // 2. Verifikasi chunk files ada di backone-production
  await exec(conn,
    'ls ' + BP + '/.next/static/chunks/ | grep -E "(3km6z|21luguo|1u6dw|1osk)" | head -10',
    '2. Cek chunk files di backone-production'
  );

  // 3. Sinkronisasi static files dari backone-production ke standalone
  await exec(conn,
    'rsync -av --ignore-existing ' + BP + '/.next/static/ ' + SA + '/.next/static/ 2>&1 | tail -5',
    '3. Rsync static files ke standalone/.next/static'
  );

  // 4. Verifikasi chunks sudah ada di standalone
  await exec(conn,
    'ls ' + SA + '/.next/static/chunks/ | grep -E "(3km6z|21luguo|1u6dw|1osk)" | head -10',
    '4. Verifikasi chunks di standalone setelah rsync'
  );

  await exec(conn,
    'ls ' + SA + '/.next/static/chunks/ | wc -l',
    '5. Total file chunks di standalone'
  );

  // 5. Update symlink _next → standalone/.next
  await exec(conn,
    'rm -f ' + PUB + '/_next && ln -s ' + SA + '/.next ' + PUB + '/_next && echo "Symlink updated"',
    '6. Update symlink _next → standalone/.next'
  );

  // 6. Verifikasi symlink
  await exec(conn,
    'ls -la ' + PUB + '/_next && ls ' + PUB + '/_next/static/chunks/ | grep -E "(3km6z|21luguo)" | head -5',
    '7. Verifikasi symlink baru'
  );

  // 7. Juga sinkronisasi public/ dari backone-production jika dibutuhkan
  await exec(conn,
    'rsync -av --ignore-existing ' + BP + '/public/ ' + PUB + '/public/ 2>&1 | tail -3 || echo "Tidak perlu sync public/"',
    '8. Sync public/ dari backone-production'
  );

  conn.end();

  // 8. Test CSS/JS via domain
  console.log('\n[9. Test CSS/JS via domain setelah fix...]');
  await new Promise(r => setTimeout(r, 3000));

  const files = [
    '/_next/static/chunks/3km6z-n6wbgrs.js',
    '/_next/static/chunks/1u6dw_tm45utz.css',
    '/_next/static/chunks/1oskchnhjm4n8.css',
    '/_next/static/chunks/21luguo5_g2uu.js',
    '/_next/static/chunks/1-8s9_t85wwr4.js',
  ];

  let allOk = true;
  for (const f of files) {
    const r = await httpGet('https://demoplace.my.id' + f);
    const icon = r.status === 200 ? '✅' : '❌';
    const ext = f.endsWith('.css') ? 'CSS' : 'JS ';
    console.log('  ' + icon + ' [' + ext + '] HTTP ' + r.status + ' | ' + (r.size || 0) + ' bytes | ' + (r.type || 'N/A'));
    if (r.status !== 200) { console.log('       → ' + f); allOk = false; }
  }

  if (allOk) {
    console.log('\n🎉 SEMUA CSS/JS BERHASIL TERMUAT!');
    console.log('   Lakukan HARD REFRESH (Ctrl+Shift+R) di browser.\n');
  } else {
    console.log('\n⚠️  Beberapa file masih 404. Mungkin perlu investigasi lebih lanjut.\n');
  }
}

main().catch(err => { console.error('[FATAL]', err.message); process.exit(1); });
