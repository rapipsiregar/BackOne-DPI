const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('echo -e "RewriteEngine On\\nRewriteRule ^(.*)$ http://127.0.0.1:3000/\\$1 [P]" > web/backend.demoplace.my.id/public_html/.htaccess; curl -I -k https://backend.demoplace.my.id', (err, stream) => {
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
