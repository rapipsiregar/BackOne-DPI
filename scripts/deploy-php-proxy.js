// scripts/deploy-php-proxy.js
// ─────────────────────────────────────────────────────────────────────────────
// BackOne DPI — Deploy PHP proxy ke public_html
// Solusi 502: Apache PHP-FPM forward semua request ke Next.js port 3000
// Tidak butuh mod_proxy_http, root access, atau Hestia API
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const { Client } = require('ssh2');
const SftpClient = require('ssh2-sftp-client');
const https = require('https');
const path = require('path');

const SSH_CONFIG = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 60000
};

const ROOT = '/home/adminbackend/web/demoplace.my.id/public_html';

// ── PHP Proxy script ──────────────────────────────────────────────────────
const PHP_PROXY = `<?php
/**
 * BackOne DPI — PHP Reverse Proxy
 * Meneruskan semua request HTTP ke Next.js yang berjalan di port 3000
 * File ini dikelola otomatis. Jangan dihapus.
 */

// Target: Next.js port 3000
define('NEXTJS_URL', 'http://127.0.0.1:3000');
define('TIMEOUT', 30);

// Ambil URI request
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$method     = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$target     = NEXTJS_URL . $requestUri;

// Kumpulkan headers dari request asli
$forwardHeaders = [
    'X-Forwarded-For: '   . ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'),
    'X-Forwarded-Proto: https',
    'X-Real-IP: '         . ($_SERVER['REMOTE_ADDR'] ?? ''),
    'Host: '              . ($_SERVER['HTTP_HOST'] ?? 'demoplace.my.id'),
];

// Tambahkan headers lain dari request
$allHeaders = getallheaders() ?: [];
$skipHeaders = ['host', 'connection', 'transfer-encoding', 'keep-alive', 'content-length'];
foreach ($allHeaders as $name => $value) {
    if (!in_array(strtolower($name), $skipHeaders)) {
        $forwardHeaders[] = "$name: $value";
    }
}

// Body untuk POST/PUT/PATCH
$body = in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE']) ? file_get_contents('php://input') : null;

// Kirim request ke Next.js
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $target,
    CURLOPT_CUSTOMREQUEST  => $method,
    CURLOPT_HTTPHEADER     => $forwardHeaders,
    CURLOPT_POSTFIELDS     => $body,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER         => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_TIMEOUT        => TIMEOUT,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_ENCODING       => '',
]);

$response   = curl_exec($ch);
$httpCode   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$curlError  = curl_error($ch);
curl_close($ch);

// Jika curl error
if ($response === false) {
    http_response_code(502);
    header('Content-Type: text/plain');
    echo 'BackOne: Gagal terhubung ke Next.js. Error: ' . $curlError;
    exit;
}

// Pisah headers dan body
$responseHeaders = substr($response, 0, $headerSize);
$responseBody    = substr($response, $headerSize);

// Set HTTP status
http_response_code($httpCode ?: 200);

// Forward response headers ke client
$skipResponseHeaders = ['transfer-encoding', 'connection', 'keep-alive', 'content-encoding'];
foreach (explode("\\r\\n", $responseHeaders) as $header) {
    $header = trim($header);
    if (empty($header) || preg_match('/^HTTP\\//i', $header)) continue;
    $colonPos = strpos($header, ':');
    if ($colonPos === false) continue;
    $headerName = strtolower(trim(substr($header, 0, $colonPos)));
    if (in_array($headerName, $skipResponseHeaders)) continue;
    header($header, false);
}

// Kirim body
echo $responseBody;
`;

// ── .htaccess baru: route semua request ke proxy.php ─────────────────────
const HTACCESS = `# BackOne DPI — Apache .htaccess
# Redirect HTTP ke HTTPS
RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Route semua request ke PHP proxy (meneruskan ke Next.js port 3000)
RewriteCond %{REQUEST_FILENAME} !proxy.php
RewriteRule ^(.*)$ /proxy.php [L,QSA]
`;

// ── Fungsi upload file via SFTP ───────────────────────────────────────────
async function uploadFile(sftp, content, remotePath) {
  const buf = Buffer.from(content, 'utf8');
  await sftp.put(buf, remotePath);
  console.log(`  ✅ Upload: ${remotePath}`);
}

// ── SSH command ────────────────────────────────────────────────────────────
function sshExec(conn, cmd) {
  console.log(`\n$ ${cmd.substring(0, 100)}...`);
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
  console.log('║   BackOne DPI — Deploy PHP Proxy (Fix 502)              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // ── Upload via SFTP ──────────────────────────────────────────────────────
  console.log('▶ Step 1: Upload proxy.php dan .htaccess via SFTP...\n');
  const sftp = new SftpClient();
  await sftp.connect(SSH_CONFIG);

  await uploadFile(sftp, PHP_PROXY, `${ROOT}/proxy.php`);
  await uploadFile(sftp, HTACCESS, `${ROOT}/.htaccess`);
  await sftp.end();

  // ── Verify dan test via SSH ──────────────────────────────────────────────
  console.log('\n▶ Step 2: Verifikasi file di server...');
  const conn = new Client();
  await new Promise((resolve, reject) => { conn.on('ready', resolve).on('error', reject).connect(SSH_CONFIG); });
  console.log('[SSH] Terhubung!\n');

  await sshExec(conn, `ls -la ${ROOT}/proxy.php ${ROOT}/.htaccess`);
  await sshExec(conn, `head -5 ${ROOT}/proxy.php`);
  await sshExec(conn, `cat ${ROOT}/.htaccess`);

  // ── Test internal Apache response ─────────────────────────────────────
  console.log('\n▶ Step 3: Test Apache internal (port 8080)...');
  await sshExec(conn, `curl -sk -o /dev/null -w "Apache HTTP: %{http_code}" http://127.0.0.1:8080/`);
  await sshExec(conn, `curl -sk -o /dev/null -w "Apache Login: %{http_code}" http://127.0.0.1:8080/login`);

  // ── Test domain publik ─────────────────────────────────────────────────
  console.log('\n▶ Step 4: Test domain demoplace.my.id...');
  await sshExec(conn,
    `sleep 2 && curl -sk -o /dev/null -w "HTTPS /: %{http_code}" https://demoplace.my.id/ && ` +
    `curl -sk -o /dev/null -w " | HTTPS /login: %{http_code}" https://demoplace.my.id/login`
  );

  conn.end();

  // ── Final test dari luar ───────────────────────────────────────────────
  console.log('\n▶ Step 5: Final test dari jaringan lokal...');
  await new Promise(r => setTimeout(r, 3000));

  for (const path of ['/', '/login']) {
    const r = await new Promise(resolve => {
      const req = https.get(`https://demoplace.my.id${path}`,
        { timeout: 12000, rejectUnauthorized: false },
        res => resolve({ status: res.statusCode, location: res.headers.location })
      );
      req.on('error', e => resolve({ status: 0, error: e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
    });
    const icon = r.status >= 200 && r.status < 400 ? '✅' : r.status === 0 ? '⚠️ ' : '❌';
    console.log(`  ${icon} https://demoplace.my.id${path} → HTTP ${r.status} ${r.error || ''}`);
    if (r.location) console.log(`     → Redirect ke: ${r.location}`);
  }

  console.log('\n✅ PHP Proxy berhasil di-deploy!\n');
  console.log('Cek browser: https://demoplace.my.id/login\n');
}

main().catch(err => { console.error('[FATAL]', err.message); process.exit(1); });
