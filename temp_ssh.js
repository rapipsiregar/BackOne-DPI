const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('ls -la /home/adminbackend/web/backend.demoplace.my.id/public_html/backend/netify_data.db /home/adminbackend/web/demoplace.my.id/public_html/backend/netify_data.db /home/adminbackend/web/backend.demoplace.my.id/public_html/.env.local /home/adminbackend/web/demoplace.my.id/public_html/.env.local 2>/dev/null', (err, stream) => {
    let out = '';
    stream.on('close', () => {
      console.log(out);
      conn.end();
    }).on('data', d => out += d).stderr.on('data', d => console.error('ERR: ' + d));
  });
}).connect({ host: '103.185.47.52', port: 2222, username: 'adminbackend', password: 'htEo7x6LsBQiEHHH' });
