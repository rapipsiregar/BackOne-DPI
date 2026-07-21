// scripts/fix-css-and-security.js
// 1. Fix CSS tidak termuat: buat symlink public_html/_next -> public_html/.next
// 2. Security audit: hapus cmd.php dan file berbahaya lainnya
'use strict';

const { Client } = require('ssh2');
const https = require('https');

const SSH = {
  host: '103.185.47.52', port: 2222,
  username: 'adminbackend', password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 60000
};

const PUB = '/home/adminbackend/web/demoplace.my.id/public_html';

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
  console.log('║   BackOne DPI — Fix CSS + Security Audit                ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const conn = new Client();
  await new Promise((resolve, reject) => { conn.on('ready', resolve).on('error', reject).connect(SSH); });
  console.log('[SSH] Terhubung!\n');

  // ── 1. SECURITY AUDIT ─────────────────────────────────────────────────
  await sshExec(conn,
    `echo "=== FILE BERBAHAYA ===" && ls -la ${PUB}/*.php ${PUB}/*.sh 2>/dev/null || echo "Tidak ada .php/.sh di root"`,
    '1. Audit file PHP di public_html'
  );

  // Hapus cmd.php jika ada (file backdoor berbahaya)
  await sshExec(conn,
    `[ -f ${PUB}/cmd.php ] && rm -f ${PUB}/cmd.php && echo "DIHAPUS: cmd.php" || echo "cmd.php tidak ada (aman)"`,
    '2. Hapus cmd.php (backdoor)'
  );

  // Hapus proxy.php lama (tidak diperlukan lagi karena nginx routing langsung ke port 3000)
  await sshExec(conn,
    `[ -f ${PUB}/proxy.php ] && rm -f ${PUB}/proxy.php && echo "DIHAPUS: proxy.php (tidak diperlukan)" || echo "proxy.php tidak ada"`,
    '3. Hapus proxy.php (tidak dibutuhkan)'
  );

  // ── 2. CEK STRUKTUR DIREKTORI ──────────────────────────────────────────
  await sshExec(conn,
    `echo "=== STRUKTUR public_html ===" && ls -la ${PUB}/ | head -30`,
    '4. Cek struktur public_html'
  );

  await sshExec(conn,
    `echo "=== .next directory ===" && ls -la ${PUB}/.next/ 2>/dev/null | head -10 || echo "TIDAK ADA .next/"`,
    '5. Cek .next directory'
  );

  await sshExec(conn,
    `echo "=== static assets ===" && ls -la ${PUB}/.next/static/ 2>/dev/null | head -10 || echo "Tidak ada .next/static/"`,
    '6. Cek .next/static'
  );

  await sshExec(conn,
    `echo "=== _next symlink ===" && ls -la ${PUB}/_next 2>/dev/null || echo "Symlink _next belum ada"`,
    '7. Cek symlink _next'
  );

  // ── 3. FIX CSS: Buat symlink _next → .next ────────────────────────────
  await sshExec(conn,
    `[ -e ${PUB}/_next ] && echo "Sudah ada _next" || (ln -s ${PUB}/.next ${PUB}/_next && echo "BERHASIL: Symlink _next → .next dibuat")`,
    '8. Buat symlink _next -> .next'
  );

  // Verifikasi symlink
  await sshExec(conn,
    `ls -la ${PUB}/_next && ls ${PUB}/_next/static/ | head -5`,
    '9. Verifikasi symlink'
  );

  // ── 4. PERBARUI .htaccess (bersih tanpa proxy.php) ────────────────────
  const cleanHtaccess = `# BackOne DPI — Apache .htaccess
# Redirect HTTP ke HTTPS saja
RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
`;

  await sshExec(conn,
    `printf '%s' ${JSON.stringify(cleanHtaccess)} > ${PUB}/.htaccess && echo "BERHASIL: .htaccess diperbarui"`,
    '10. Perbarui .htaccess (hanya redirect HTTPS)'
  );

  // ── 5. TEST CSS LOADING ─────────────────────────────────────────────────
  console.log('\n[11. Test loading CSS dari /_next/static/]');
  await sshExec(conn,
    `CSS_FILE=$(ls ${PUB}/.next/static/css/*.css 2>/dev/null | head -1) && ` +
    `[ -n "$CSS_FILE" ] && ` +
    `FILENAME=$(basename "$CSS_FILE") && ` +
    `curl -sk -o /dev/null -w "CSS via domain: %{http_code} (size: %{size_download} bytes)" https://demoplace.my.id/_next/static/css/$FILENAME || ` +
    `echo "Tidak ada file CSS ditemukan"`,
    '11. Test CSS via domain'
  );

  conn.end();

  // ── Test dari luar ──────────────────────────────────────────────────────
  console.log('\n[12. Test domain setelah fix...]');
  await new Promise(r => setTimeout(r, 2000));

  for (const path of ['/login', '/api/health']) {
    const r = await new Promise(resolve => {
      const req = https.get(`https://demoplace.my.id${path}`,
        { timeout: 10000, rejectUnauthorized: false },
        res => {
          let body = '';
          res.on('data', d => body += d);
          res.on('end', () => resolve({ status: res.statusCode, body: body.substring(0, 100) }));
        }
      );
      req.on('error', e => resolve({ status: 0, error: e.message }));
    });
    const icon = r.status === 200 ? '✅' : r.status === 301 ? '↩️ ' : '❌';
    console.log(`  ${icon} https://demoplace.my.id${path} → HTTP ${r.status}`);
    if (path === '/api/health') console.log(`     Body: ${r.body}`);
  }

  console.log('\n✅ Fix selesai! Coba refresh https://demoplace.my.id/login\n');
}

main().catch(err => { console.error('[FATAL]', err.message); process.exit(1); });
