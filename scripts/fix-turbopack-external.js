// scripts/fix-turbopack-external.js
// Fix: Buat wrapper module untuk hashed external modules yang diperlukan Turbopack
'use strict';
const { Client } = require('ssh2');

const SSH = { host: '103.185.47.52', port: 2222, username: 'adminbackend', password: 'htEo7x6LsBQiEHHH', readyTimeout: 60000 };
const PUB = '/home/adminbackend/web/demoplace.my.id/public_html';

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

async function main() {
  const conn = new Client();
  await new Promise((r, j) => { conn.on('ready', r).on('error', j).connect(SSH); });
  console.log('[SSH] Connected\n');

  const PM2 = '/home/adminbackend/.npm-global/bin/pm2';
  const NM  = PUB + '/node_modules';
  const SA  = PUB + '/.next/standalone';

  // 1. Verifikasi mongoose asli tersedia di public_html/node_modules
  await exec(conn, 'ls ' + NM + '/mongoose/package.json 2>/dev/null && echo "mongoose OK" || echo "mongoose TIDAK ADA"', '1. Cek mongoose asli');

  // 2. Cek error log untuk nama hash yang dipakai
  await exec(conn, 'grep "mongoose-" ' + PUB + '/logs/frontend-error.log 2>/dev/null | grep "Cannot find" | tail -5', '2. Hash mongoose dari error log');

  // 3. Buat wrapper module mongoose-8b99e611e7552af3
  const HASH_PKG = NM + '/mongoose-8b99e611e7552af3';
  await exec(conn,
    'mkdir -p ' + HASH_PKG + ' && ' +
    'echo \'{"name":"mongoose-8b99e611e7552af3","version":"1.0.0","main":"index.js"}\' > ' + HASH_PKG + '/package.json && ' +
    'echo \'module.exports = require("mongoose");\' > ' + HASH_PKG + '/index.js && ' +
    'echo "Wrapper module dibuat"',
    '3. Buat wrapper mongoose-8b99e611e7552af3'
  );

  // 4. Verifikasi wrapper
  await exec(conn, 'cat ' + HASH_PKG + '/index.js', '4. Isi wrapper module');

  // 5. Juga cek apakah ada hash lain yang mungkin gagal (better-sqlite3)
  await exec(conn,
    'grep "Cannot find module" ' + PUB + '/logs/frontend-error.log 2>/dev/null | grep -v mongoose | tail -5',
    '5. Cek module lain yang mungkin gagal'
  );

  // 6. Cek standalone/node_modules - apakah ada?
  await exec(conn,
    'ls -la ' + SA + '/ | grep node_modules || echo "standalone/node_modules TIDAK ADA"',
    '6. Cek standalone/node_modules'
  );

  // 7. Buat standalone/node_modules symlink ke public_html/node_modules
  await exec(conn,
    '[ -d ' + SA + '/node_modules ] && echo "Sudah ada" || ' +
    '(ln -s ' + NM + ' ' + SA + '/node_modules && echo "Symlink node_modules dibuat")',
    '7. Buat symlink standalone/node_modules → public_html/node_modules'
  );

  // 8. Restart frontend
  await exec(conn, PM2 + ' restart backone-frontend --update-env && echo "RESTART OK"', '8. Restart frontend');

  // 9. Tunggu startup
  await new Promise(r => setTimeout(r, 8000));

  // 10. Test agents page
  await exec(conn,
    'curl -sk -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:3000/agents',
    '9. Test /agents (HTTP code)'
  );

  // 11. Cek error log setelah restart
  await exec(conn, 'tail -10 ' + PUB + '/logs/frontend-error.log 2>/dev/null', '10. Error log setelah fix');

  conn.end();
  console.log('\n✅ Selesai! Refresh browser ke https://demoplace.my.id/agents\n');
}

main().catch(e => console.error('[FATAL]', e.message));
