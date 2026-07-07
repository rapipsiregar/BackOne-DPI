const { Client } = require('ssh2');

const script = `
set -e

echo "=== STOPPING PM2 ==="
npx pm2 delete dpi-web || true

echo "=== STARTING PM2 ==="
cd /home/adminbackend/web/demoplace.my.id/public_html
# Restarting pm2 daemon and processes
PORT=10000 npx pm2 start ./node_modules/next/dist/bin/next --name "dpi-web" --interpreter /home/adminbackend/node20/bin/node -- start
npx pm2 save
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
