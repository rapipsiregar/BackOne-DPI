const { Client } = require('ssh2');

const script = `
set -e
export PATH=/home/adminbackend/node20/bin:$PATH

echo "=== STOPPING PM2 ==="
npx pm2 delete all || true

echo "=== REBUILDING NATIVE MODULES ==="
cd /home/adminbackend/web/demoplace.my.id/public_html
# Make sure sqlite3 is rebuilt for node20
npm rebuild better-sqlite3

echo "=== STARTING PM2 ==="
# Next.js must run on 10000 because Hestia Nginx proxy looks for 10000
# Backend API runs on 3001
PORT=10000 npx pm2 start /home/adminbackend/node20/bin/npm --name "dpi-web" --interpreter /home/adminbackend/node20/bin/node -- start
PORT=3001 npx pm2 start backend/server.js --name "dpi-api" --interpreter /home/adminbackend/node20/bin/node

npx pm2 save
npx pm2 status
`;

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected. Running fix script...');
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Fix script finished with code ' + code);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
  console.error('SSH Error:', err);
}).connect({
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 99999
});
