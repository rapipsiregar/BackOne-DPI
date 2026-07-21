const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`ls -la /home/adminbackend/web/demoplace.my.id/public_html/.next/standalone/.next/server/app/\\(dashboard\\)/ 2>/dev/null || ls -la /home/adminbackend/web/demoplace.my.id/public_html/.next/server/app/`, (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log('=== REMOTE DASHBOARD APP ROUTES ===\n' + out);
      conn.end();
    });
  });
}).connect({
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH'
});
