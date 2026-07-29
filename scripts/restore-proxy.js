// scripts/restore-proxy.js
// Pulihkan proxy.php + htaccess yang rusak via SFTP
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

// ── PHP Proxy (forward semua ke Next.js port 3000) ──────────────────────
const PROXY_PHP = `<?php
/**
 * BackOne DPI - PHP Reverse Proxy
 * Meneruskan semua request ke Next.js port 3000
 */
define('NEXTJS_URL', 'http://127.0.0.1:3000');

$uri    = $_SERVER['REQUEST_URI'] ?? '/';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$target = NEXTJS_URL . $uri;

$fwdHeaders = [
    'X-Forwarded-For: '    . ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'),
    'X-Forwarded-Proto: https',
    'X-Real-IP: '          . ($_SERVER['REMOTE_ADDR'] ?? ''),
    'Host: '               . ($_SERVER['HTTP_HOST'] ?? 'demoplace.my.id'),
];

$allHeaders = getallheaders() ?: [];
$skip = ['host','connection','transfer-encoding','keep-alive','content-length'];
foreach ($allHeaders as $name => $value) {
    if (!in_array(strtolower($name), $skip)) {
        $fwdHeaders[] = "$name: $value";
    }
}

$body = in_array($method, ['POST','PUT','PATCH','DELETE']) ? file_get_contents('php://input') : null;

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
    CURLOPT_ENCODING       => '',
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

$skipRes = ['transfer-encoding','connection','keep-alive','content-encoding'];
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

// ── .htaccess (routing ke proxy.php) ──────────────────────────────────
const HTACCESS = `# BackOne DPI — Apache .htaccess
# Redirect HTTP ke HTTPS
RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Static Next.js files: sajikan langsung dari disk
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^ - [L]

# Semua request lain: teruskan ke PHP proxy (Next.js port 3000)
RewriteRule ^(.*)$ /proxy.php [L,QSA]
`;

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   BackOne DPI — Pulihkan proxy.php & .htaccess          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // ── Upload via SFTP ──────────────────────────────────────────────────
  console.log('▶ Upload proxy.php dan .htaccess via SFTP...');
  const sftp = new SftpClient();
  await sftp.connect(CONFIG);

  await sftp.put(Buffer.from(PROXY_PHP, 'utf8'), `${ROOT}/proxy.php`);
  console.log('  ✅ proxy.php diupload');

  await sftp.put(Buffer.from(HTACCESS, 'utf8'), `${ROOT}/.htaccess`);
  console.log('  ✅ .htaccess diupload (dengan newline yang benar)');

  await sftp.end();

  // ── Verifikasi via SSH ───────────────────────────────────────────────
  console.log('\n▶ Verifikasi di server...');
  const conn = new Client();
  await new Promise((r, j) => { conn.on('ready', r).on('error', j).connect(CONFIG); });
  console.log('[SSH] Terhubung!\n');

  await new Promise((resolve) => {
    conn.exec(
      `echo "=== .htaccess ===" && cat ${ROOT}/.htaccess && ` +
      `echo "" && echo "=== proxy.php (5 baris awal) ===" && head -5 ${ROOT}/proxy.php && ` +
      `echo "" && echo "=== Test port 3000 ===" && curl -sk -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:3000/login && echo "" && ` +
      `echo "=== Test port 8009/8080 ===" && curl -sk -o /dev/null -w "Apache 8009: %{http_code}" http://127.0.0.1:8009/ && echo "" && curl -sk -o /dev/null -w "Apache 8080: %{http_code}" http://103.185.47.52:8080/login && echo ""`,
      (err, s) => {
        if (err) { resolve(); return; }
        s.on('data', d => process.stdout.write(d.toString()))
         .stderr.on('data', d => process.stdout.write(d.toString()))
         .on('close', () => { resolve(); });
      }
    );
  });

  conn.end();

  // ── Test external ────────────────────────────────────────────────────
  console.log('\n▶ Test domain dari luar (tunggu 3 detik)...');
  await new Promise(r => setTimeout(r, 3000));

  for (const path of ['/', '/login', '/api/health']) {
    const r = await new Promise(resolve => {
      const req = https.get(`https://demoplace.my.id${path}`,
        { timeout: 12000, rejectUnauthorized: false },
        res => {
          let body = '';
          res.on('data', d => body += d);
          res.on('end', () => resolve({ status: res.statusCode, body: body.substring(0, 80), location: res.headers.location }));
        }
      );
      req.on('error', e => resolve({ status: 0, error: e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
    });

    const icon = r.status === 200 ? '✅' : r.status === 301 || r.status === 307 ? '↩️ ' : '❌';
    console.log(`  ${icon} https://demoplace.my.id${path} → HTTP ${r.status} ${r.error || ''}`);
    if (r.location) console.log(`     → ${r.location}`);
  }

  console.log('\n✅ Selesai! Refresh https://demoplace.my.id/login\n');
}

main().catch(err => { console.error('[FATAL]', err.message); process.exit(1); });
