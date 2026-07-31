// scripts/fix-proxy-php.js
const { Client } = require('ssh2');

const CONFIG = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
};

const cleanProxyPhpCode = `<?php
// proxy.php — Reverse proxy to BackOne Dashboard Engine on port 3000
$target = 'http://127.0.0.1:3000' . $_SERVER['REQUEST_URI'];

$ch = curl_init($target);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
curl_setopt($ch, CURLOPT_TIMEOUT, 45);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);

// Forward headers
$req_headers = array();
foreach (getallheaders() as $k => $v) {
    if (strtolower($k) !== 'host') {
        $req_headers[] = "$k: $v";
    }
}
$req_headers[] = "Host: demoplace.my.id";
curl_setopt($ch, CURLOPT_HTTPHEADER, $req_headers);

// Forward body
if (in_array($_SERVER['REQUEST_METHOD'], array('POST', 'PUT', 'PATCH'))) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
}

$resp = curl_exec($ch);
if ($resp === false) {
    http_response_code(502);
    die("BackOne Dashboard: Service temporarily unavailable (502 Gateway Timeout). Please try refreshing in a few seconds.");
}

$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$resp_headers = substr($resp, 0, $header_size);
$body = substr($resp, $header_size);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

http_response_code($status);
foreach (explode("\r\n", $resp_headers) as $h) {
    if ($h && !str_starts_with($h, 'HTTP/') && !str_starts_with(strtolower($h), 'transfer-encoding:')) {
        header($h, false);
    }
}
echo $body;
?>
`;

async function main() {
  const ssh = new Client();
  ssh.on('ready', () => {
    console.log('[SSH] Connected. Updating proxy.php on server...');
    const command = `cat << 'EOF' > /home/adminbackend/web/demoplace.my.id/public_html/proxy.php\n${cleanProxyPhpCode}\nEOF`;
    ssh.exec(command, (err, stream) => {
      if (err) throw err;
      stream.on('data', (d) => process.stdout.write(d));
      stream.on('close', () => {
        console.log('\n[OK] proxy.php updated cleanly with white-labeling compliance!');
        ssh.end();
      });
    });
  }).connect({ host: CONFIG.host, port: CONFIG.port, username: CONFIG.username, password: CONFIG.password });
}

main().catch(console.error);
