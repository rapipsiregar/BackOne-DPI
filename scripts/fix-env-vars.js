// scripts/fix-env-vars.js
// Fix: Pastikan environment variables dari .env.production dimuat oleh PM2 frontend
'use strict';
const { Client } = require('ssh2');

const SSH = { host: '103.185.47.52', port: 2222, username: 'adminbackend', password: 'htEo7x6LsBQiEHHH', readyTimeout: 60000 };
const PUB = '/home/adminbackend/web/demoplace.my.id/public_html';
const PM2 = '/home/adminbackend/.npm-global/bin/pm2';

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

  // 1. Cek env vars yang diterima proses PM2 sekarang
  await exec(conn, PM2 + ' env 3 2>/dev/null | grep -E "(NETIFY|BACKONE|MONGO|JWT)" | head -15', '1. Env vars di PM2 proses 3 (frontend)');

  // 2. Cek isi .env.production
  await exec(conn, 'cat ' + PUB + '/.env.production 2>/dev/null | grep -v "#" | grep -v "^$" | head -30', '2. Isi .env.production (non-comment)');

  // 3. Export vars dari .env.production dan restart dengan env vars eksplisit
  // Baca .env.production, parse, dan set ke PM2
  const envScript = `
set -a
source ${PUB}/.env.production 2>/dev/null
set +a
export NETIFY_API_KEY="$NETIFY_API_KEY"
export NETIFY_ORG_UUID="$NETIFY_ORG_UUID"
export NETIFY_SITE_UUIDS="$NETIFY_SITE_UUIDS"
export NETIFY_INFORMATICS_BASE_URL="$NETIFY_INFORMATICS_BASE_URL"
export MONGODB_URI="$MONGODB_URI"
export JWT_SECRET="$JWT_SECRET"
export NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL"
echo "API_KEY=$NETIFY_API_KEY"
echo "MONGO_URI_PARTIAL=$(echo $MONGODB_URI | cut -c1-30)..."
  `.trim();
  await exec(conn, 'bash -c \'' + envScript.replace(/\n/g, '; ') + '\'', '3. Verifikasi env vars bisa dibaca dari .env.production');

  // 4. Delete dan restart PM2 proses dengan ecosystem file yang membaca env_file
  await exec(conn,
    'cd ' + PUB + ' && ' + PM2 + ' delete backone-frontend 2>/dev/null; ' +
    PM2 + ' start ecosystem.config.js --only backone-frontend --env production && echo "START OK"',
    '4. Restart frontend via ecosystem.config.js'
  );

  // 5. Verifikasi env vars sekarang dimuat
  await new Promise(r => setTimeout(r, 5000));
  await exec(conn, PM2 + ' env 3 2>/dev/null | grep -E "(NETIFY|BACKONE|MONGO)" | head -10', '5. Verifikasi env vars setelah restart');

  // 6. Test agents page
  await new Promise(r => setTimeout(r, 5000));
  await exec(conn, 'curl -sk -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:3000/agents', '6. Test /agents');

  // 7. Cek error log terbaru
  await exec(conn, 'tail -5 ' + PUB + '/logs/frontend-error.log 2>/dev/null', '7. Error log terbaru');

  // 8. PM2 status akhir
  await exec(conn, PM2 + ' list 2>/dev/null | grep backone', '8. PM2 status akhir');

  conn.end();
  console.log('\n✅ Selesai!\n');
}

main().catch(e => console.error('[FATAL]', e.message));
