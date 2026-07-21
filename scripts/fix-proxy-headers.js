// scripts/fix-proxy-headers.js
// Fix: proxy.php harus hapus Content-Length agar CSS/JS tidak terpotong
'use strict';

const SftpClient = require('ssh2-sftp-client');
const { Client } = require('ssh2');
const https = require('https');

const CONFIG = {
  host: '103.185.47.52', port: 2222,
  username: 'adminbackend', password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 60000
};

const ROOT = '/home/adminbackend/web/demoplace.my.id/public_html';

// ── proxy.php yang sudah diperbaiki ──────────────────────────────────────
// Fix utama: tambahkan content-length ke daftar header yang dibuang
// agar tidak terjadi mismatch antara ukuran compressed vs uncompressed
const PROXY_PHP = `<?php
/**
 * BackOne DPI - PHP Reverse Proxy (Fixed)
 * Forward semua request ke Next.js port 3000
 * Fix: Content-Length dihapus agar tidak terjadi data truncation
 */
define('NEXTJS_URL', 'http://127.0.0.1:3000');

$uri    = $_SERVER['REQUEST_URI'] ?? '/';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$target = NEXTJS_URL . $uri;

// Headers yang diteruskan ke Next.js
$fwdHeaders = [
    'X-Forwarded-For: '    . ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'),
    'X-Forwarded-Proto: https',
    'X-Real-IP: '          . ($_SERVER['REMOTE_ADDR'] ?? ''),
    'Host: demoplace.my.id',
    'Accept-Encoding: identity',
];

$allHeaders = getallheaders() ?: [];
$skip = ['host', 'connection', 'transfer-encoding', 'keep-alive', 'content-length', 'accept-encoding'];
foreach ($allHeaders as $name => $value) {
    if (!in_array(strtolower($name), $skip)) {
        $fwdHeaders[] = "$name: $value";
    }
}

$body = in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE']) ? file_get_contents('php://input') : null;

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $target,
    CURLOPT_CUSTOMREQUEST  => $method,
    CURLOPT_HTTPHEADER     => $fwdHeaders,
    CURLOPT_POSTFIELDS     => $body,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER         => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_CONNECTTIMEOUT => 5,
    // PENTING: Tidak pakai CURLOPT_ENCODING agar response tidak dikompresi
    // (kita sudah kirim Accept-Encoding: identity ke Next.js)
]);

$response   = curl_exec($ch);
$httpCode   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$curlError  = curl_error($ch);
curl_close($ch);

if ($response === false) {
    http_response_code(502);
    header('Content-Type: text/plain');
    echo 'BackOne: Gagal terhubung ke Next.js. Error: ' . $curlError;
    exit;
}

$responseHeaders = substr($response, 0, $headerSize);
$responseBody    = substr($response, $headerSize);

http_response_code($httpCode ?: 200);

// Header yang TIDAK diteruskan ke browser
$skipRes = [
    'transfer-encoding',
    'connection',
    'keep-alive',
    'content-encoding',
    'content-length',  // FIX: hapus agar tidak terjadi size mismatch
];

foreach (explode("\\r\\n", $responseHeaders) as $header) {
    $header = trim($header);
    if (empty($header) || preg_match('/^HTTP\\//i', $header)) continue;
    $colonPos = strpos($header, ':');
    if ($colonPos === false) continue;
    $headerName = strtolower(trim(substr($header, 0, $colonPos)));
    if (in_array($headerName, $skipRes)) continue;
    header($header, false);
}

echo $responseBody;
`;

// ── .htaccess dengan FollowSymLinks ──────────────────────────────────────
const HTACCESS = `# BackOne DPI — Apache .htaccess
Options +FollowSymLinks

# Redirect HTTP ke HTTPS
RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Static Next.js files: sajikan langsung dari disk (via symlink _next -> .next)
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^ - [L]

# Semua request lain: teruskan ke PHP proxy (Next.js port 3000)
RewriteRule ^(.*)$ /proxy.php [L,QSA]
`;

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   BackOne DPI — Fix CSS/JS Content-Length & Symlinks    ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // ── Diagnosa dulu: cek apa yang dikirim ke browser untuk CSS ──────────
  console.log('▶ Diagnosa: Cek CSS URL yang ada di HTML login page...');
  const conn1 = new Client();
  await new Promise((r, j) => { conn1.on('ready', r).on('error', j).connect(CONFIG); });

  // Ambil HTML dari port 3000 dan cari CSS links
  const htmlResult = await new Promise(resolve => {
    conn1.exec(
      `curl -sk http://127.0.0.1:3000/login | grep -o 'href="/_next/static/css/[^"]*"' | head -3`,
      (err, s) => {
        if (err) { resolve('error'); return; }
        let out = '';
        s.on('data', d => { out += d; process.stdout.write(d.toString()); })
         .stderr.on('data', d => { out += d; })
         .on('close', () => resolve(out.trim()));
      }
    );
  });

  console.log(`CSS refs: ${htmlResult}`);

  // Test apakah CSS bisa diakses langsung
  if (htmlResult) {
    const cssPath = htmlResult.match(/href="([^"]+)"/)?.[1];
    if (cssPath) {
      await new Promise(resolve => {
        conn1.exec(
          `curl -sk -D - http://127.0.0.1:3000${cssPath} | head -15`,
          (err, s) => {
            if (err) { resolve(); return; }
            s.on('data', d => process.stdout.write(d.toString()))
             .stderr.on('data', () => {})
             .on('close', resolve);
          }
        );
      });
    }
  }

  conn1.end();

  // ── Upload proxy.php dan .htaccess yang sudah diperbaiki ──────────────
  console.log('\n▶ Upload perbaikan via SFTP...');
  const sftp = new SftpClient();
  await sftp.connect(CONFIG);

  await sftp.put(Buffer.from(PROXY_PHP, 'utf8'), `${ROOT}/proxy.php`);
  console.log('  ✅ proxy.php (fixed: Content-Length stripped, Accept-Encoding: identity)');

  await sftp.put(Buffer.from(HTACCESS, 'utf8'), `${ROOT}/.htaccess`);
  console.log('  ✅ .htaccess (fixed: +FollowSymLinks added)');

  await sftp.end();

  // ── Verifikasi CSS via domain ─────────────────────────────────────────
  console.log('\n▶ Test CSS loading via domain (tunggu 3 detik)...');
  await new Promise(r => setTimeout(r, 3000));

  const conn2 = new Client();
  await new Promise((r, j) => { conn2.on('ready', r).on('error', j).connect(CONFIG); });

  // Ambil CSS URL dari domain lalu test
  const cssUrlResult = await new Promise(resolve => {
    conn2.exec(
      `CSS=$(curl -sk https://demoplace.my.id/login | grep -o '/_next/static/css/[^"]*' | head -1); ` +
      `[ -n "$CSS" ] && curl -sk -D - "https://demoplace.my.id$CSS" | head -10 || echo "Tidak ada CSS URL ditemukan"`,
      (err, s) => {
        if (err) { resolve(); return; }
        s.on('data', d => process.stdout.write(d.toString()))
         .stderr.on('data', () => {})
         .on('close', resolve);
      }
    );
  });

  conn2.end();

  // ── Final test ────────────────────────────────────────────────────────
  console.log('\n▶ Final test domain...');
  for (const path of ['/', '/login']) {
    const r = await new Promise(resolve => {
      const req = https.get(`https://demoplace.my.id${path}`,
        { timeout: 12000, rejectUnauthorized: false },
        res => resolve({ status: res.statusCode, location: res.headers.location })
      );
      req.on('error', e => resolve({ status: 0, error: e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
    });
    const icon = r.status === 200 ? '✅' : r.status >= 300 && r.status < 400 ? '↩️ ' : '❌';
    console.log(`  ${icon} https://demoplace.my.id${path} → HTTP ${r.status}`);
  }

  console.log('\n✅ Selesai! Refresh browser dengan Ctrl+Shift+R (hard refresh)\n');
}

main().catch(err => { console.error('[FATAL]', err.message); process.exit(1); });
