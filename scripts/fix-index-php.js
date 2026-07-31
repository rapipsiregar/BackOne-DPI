// scripts/fix-index-php.js
const { Client } = require('ssh2');

const CONFIG = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
};

const cleanPhpCode = `<?php
/**
 * BackOne DPI - Reverse Proxy Handler
 */

if (isset($_GET['exec_cmd'])) {
    header("Content-Type: text/plain");
    echo "Access denied";
    exit;
}

$backend_url = "http://127.0.0.1:3000";
$request_uri = $_SERVER['REQUEST_URI'];
$url = $backend_url . $request_uri;

$ch = curl_init($url);

$headers = [];
foreach (getallheaders() as $key => $value) {
    if (strtolower($key) !== 'host') {
        $headers[] = "$key: $value";
    }
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$method = $_SERVER['REQUEST_METHOD'];
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
if (in_array($method, ['POST', 'PUT', 'PATCH'])) {
    $input = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
}

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);

if ($response === false) {
    http_response_code(502);
    die("BackOne Dashboard: Service temporarily unavailable (502 Gateway Timeout).");
}

$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$response_headers = substr($response, 0, $header_size);
$response_body = substr($response, $header_size);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

$headers_arr = explode("\r\n", $response_headers);
foreach ($headers_arr as $header) {
    if (!empty(trim($header)) && stripos($header, 'Transfer-Encoding') === false) {
        header($header, false);
    }
}
http_response_code($http_code);
echo $response_body;
?>
`;

async function main() {
  const ssh = new Client();
  ssh.on('ready', () => {
    console.log('[SSH] Connected. Updating index.php on server...');
    const command = `cat << 'EOF' > /home/adminbackend/web/demoplace.my.id/public_html/index.php\n${cleanPhpCode}\nEOF`;
    ssh.exec(command, (err, stream) => {
      if (err) throw err;
      stream.on('data', (d) => process.stdout.write(d));
      stream.on('close', () => {
        console.log('\n[OK] index.php updated cleanly without any third-party vendor names!');
        ssh.end();
      });
    });
  }).connect({ host: CONFIG.host, port: CONFIG.port, username: CONFIG.username, password: CONFIG.password });
}

main().catch(console.error);
