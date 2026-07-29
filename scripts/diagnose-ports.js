// scripts/diagnose-ports.js
// Cek port apa yang aktif dan test PHP proxy di port yang benar
'use strict';

const { Client } = require('ssh2');

const SSH = {
  host: '103.185.47.52', port: 2222,
  username: 'adminbackend', password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 60000
};

function sshExec(conn, cmd, label = '') {
  if (label) console.log(`\n[${label}]`);
  console.log(`$ ${cmd.substring(0, 100)}${cmd.length > 100 ? '...' : ''}`);
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('close', () => resolve(out))
            .on('data', d => { out += d; process.stdout.write(d.toString()); })
            .stderr.on('data', d => { out += d; process.stdout.write(d.toString()); });
    });
  });
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   BackOne DPI — Diagnosa Port & PHP Proxy Test          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const conn = new Client();
  await new Promise((resolve, reject) => { conn.on('ready', resolve).on('error', reject).connect(SSH); });
  console.log('[SSH] Terhubung!\n');

  // 1. Cek semua port yang aktif
  await sshExec(conn,
    'echo "=== SEMUA PORT AKTIF ===" && ss -tlnp | grep -E "(80|443|3000|3001|4000|8008|8009|8080|8443)"',
    'PORT AKTIF'
  );

  // 2. Cek apakah Apache aktif di berbagai port
  await sshExec(conn,
    'echo "=== TES APACHE PORT 8009 ===" && curl -sk -o /dev/null -w "Port 8009: %{http_code}" http://127.0.0.1:8009/login',
    'TES PORT 8009'
  );

  await sshExec(conn,
    'echo "=== TES APACHE PORT 8080 (IP publik) ===" && curl -sk -o /dev/null -w "Port 8080 publik: %{http_code}" http://103.185.47.52:8080/login',
    'TES PORT 8080'
  );

  // 3. Cek apakah PHP FPM socket ada
  await sshExec(conn,
    'ls -la /run/php/php*-fpm-demoplace* 2>/dev/null || echo "Tidak ada PHP FPM socket untuk domain ini"',
    'PHP FPM SOCKET'
  );

  // 4. Cek isi .htaccess yang aktif
  await sshExec(conn,
    'cat /home/adminbackend/web/demoplace.my.id/public_html/.htaccess',
    'HTACCESS AKTIF'
  );

  // 5. Cek apakah proxy.php bisa diakses via Apache
  await sshExec(conn,
    'curl -sk -v http://127.0.0.1:8009/proxy.php 2>&1 | head -30',
    'TES proxy.php via port 8009'
  );

  // 6. Test direct PHP execution
  await sshExec(conn,
    'php -r "echo curl_version()[\'version\'];" 2>/dev/null && echo " (PHP curl OK)" || echo "PHP curl tidak tersedia"',
    'CEK PHP CURL'
  );

  // 7. Cek Apache error log
  await sshExec(conn,
    'tail -20 /var/log/apache2/domains/demoplace.my.id.error.log 2>/dev/null | grep -v "^\$" | tail -10 || echo "Tidak bisa akses error log"',
    'APACHE ERROR LOG'
  );

  // 8. Test Next.js langsung
  await sshExec(conn,
    'curl -sk -o /dev/null -w "Next.js port 3000 /login: %{http_code}" http://127.0.0.1:3000/login',
    'TES NEXT.JS LANGSUNG'
  );

  // 9. Coba test PHP via curl dengan header Host
  await sshExec(conn,
    'curl -sk -H "Host: demoplace.my.id" -o /dev/null -w "Apache dengan Host header: %{http_code}" http://127.0.0.1:8009/',
    'TES APACHE HOST HEADER'
  );

  conn.end();
  console.log('\n✅ Diagnosa selesai!\n');
}

main().catch(err => { console.error('[FATAL]', err.message); process.exit(1); });
