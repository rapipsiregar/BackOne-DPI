const { Client } = require('ssh2');

const script = `
sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://backend.demoplace.my.id,http://backend.demoplace.my.id,https://demoplace.my.id,http://demoplace.my.id|g" /home/adminbackend/web/demoplace.my.id/public_html/.env.local
cd /home/adminbackend/web/demoplace.my.id/public_html
npx pm2 restart dpi-api
`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect({
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH'
});
