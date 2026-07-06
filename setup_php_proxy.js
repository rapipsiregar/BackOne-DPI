const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmds = `
    cd /home/adminbackend/web/backend.demoplace.my.id/public_html
    
    # Create symlink for Next.js static files
    mkdir -p _next
    ln -sf ../.next/static _next/static
    
    # Write index.php reverse proxy
    cat << 'EOF' > index.php
<?php
$backend_url = "http://127.0.0.1:3000";
$request_uri = $_SERVER['REQUEST_URI'];
$url = $backend_url . $request_uri;

$headers = getallheaders();
$curl_headers = array();
foreach ($headers as $key => $value) {
    if (strtolower($key) !== 'host' && strtolower($key) !== 'connection') {
        $curl_headers[] = "$key: $value";
    }
}
$curl_headers[] = "Host: backend.demoplace.my.id";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
curl_setopt($ch, CURLOPT_HTTPHEADER, $curl_headers);

if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT' || $_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $input = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
}

$response = curl_exec($ch);
if ($response === false) {
    http_response_code(502);
    echo "Bad Gateway: Unable to connect to Node.js backend.";
    exit;
}

$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$response_header = substr($response, 0, $header_size);
$response_body = substr($response, $header_size);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

$res_headers = explode("\\r\\n", $response_header);
foreach ($res_headers as $header) {
    if (empty(trim($header))) continue;
    if (preg_match('/^Transfer-Encoding:/i', $header)) continue;
    if (preg_match('/^Content-Encoding:/i', $header)) continue;
    header($header, false);
}

http_response_code($http_code);
echo $response_body;
?>
EOF

    # Write .htaccess
    cat << 'EOF' > .htaccess
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [L,QSA]
EOF

    # Test the URL locally
    curl -I -k https://backend.demoplace.my.id/login
  `;
  
  conn.exec(cmds, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).connect({
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH'
});
