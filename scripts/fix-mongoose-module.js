// scripts/fix-mongoose-module.js
// Fix: Copy mongoose ke standalone/node_modules agar tersedia sebagai external package
'use strict';
const { Client } = require('ssh2');

const SSH = { host: '103.185.47.52', port: 2222, username: 'adminbackend', password: 'htEo7x6LsBQiEHHH', readyTimeout: 60000 };
const PUB  = '/home/adminbackend/web/demoplace.my.id/public_html';
const SA   = PUB + '/.next/standalone';
const BP   = '/home/adminbackend/backone-production';

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

  // 1. Cek lokasi mongoose
  await exec(conn, 'ls ' + SA + '/node_modules/mongoose 2>/dev/null | head -3 || echo "Tidak ada di standalone/node_modules"', '1. Cek mongoose di standalone');
  await exec(conn, 'ls ' + BP + '/node_modules/mongoose 2>/dev/null | head -3 || echo "Tidak ada di backone-production"', '2. Cek mongoose di backone-production');
  await exec(conn, 'ls ' + PUB + '/node_modules/mongoose 2>/dev/null | head -3 || echo "Tidak ada di public_html/node_modules"', '3. Cek mongoose di public_html');

  // 2. Copy mongoose ke standalone/node_modules (dari backone-production)
  const mongooseSrc = BP + '/node_modules/mongoose';
  const mongooseDst = SA + '/node_modules/mongoose';
  await exec(conn,
    '[ -d ' + mongooseSrc + ' ] && (' +
    '  [ -e ' + mongooseDst + ' ] && echo "Sudah ada" || ' +
    '  (cp -r ' + mongooseSrc + ' ' + mongooseDst + ' && echo "BERHASIL: mongoose disalin ke standalone") ' +
    ') || echo "Sumber tidak ditemukan"',
    '4. Copy mongoose ke standalone/node_modules'
  );

  // 3. Verifikasi
  await exec(conn, 'ls ' + mongooseDst + ' 2>/dev/null | head -5 || echo "GAGAL: tidak ada"', '5. Verifikasi mongoose di standalone');

  // 4. Juga pastikan dependensi mongoose tersedia (bson, etc.)
  const deps = ['bson', 'kareem', 'mquery', 'mpath', 'sift'];
  for (const dep of deps) {
    const src = BP + '/node_modules/' + dep;
    const dst = SA + '/node_modules/' + dep;
    await exec(conn,
      '[ -d ' + src + ' ] && ([ -e ' + dst + ' ] || (cp -r ' + src + ' ' + dst + ' && echo "Copied: ' + dep + '")) || echo "Skip: ' + dep + '"',
      null
    );
  }

  // 5. Restart frontend
  await exec(conn, PM2 + ' restart backone-frontend && echo "RESTART OK"', '6. Restart backone-frontend');

  // 6. Tunggu dan cek status
  await new Promise(r => setTimeout(r, 5000));
  await exec(conn, PM2 + ' list 2>/dev/null | grep backone', '7. Status PM2 setelah restart');

  // 7. Test halaman agents
  await new Promise(r => setTimeout(r, 3000));
  await exec(conn, 'curl -sk -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:3000/agents', '8. Test /agents setelah fix');

  // 8. Cek error log setelah restart
  await exec(conn, 'tail -10 ' + PUB + '/logs/frontend-error.log 2>/dev/null', '9. Error log terbaru');

  conn.end();
  console.log('\n✅ Selesai! Refresh browser ke https://demoplace.my.id/agents\n');
}

main().catch(e => console.error('[FATAL]', e.message));
