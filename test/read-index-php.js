const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec("cat /home/adminbackend/web/demoplace.my.id/public_html/index.php", (err, stream) => {
    stream.on('data', (d) => process.stdout.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '103.185.47.52', port: 2222, username: 'adminbackend', password: 'htEo7x6LsBQiEHHH' });
