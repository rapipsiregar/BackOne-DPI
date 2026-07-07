const { Client } = require('ssh2');

const conn = new Client();

const script = `
set -e
export PATH=/home/adminbackend/node20/bin:$PATH

echo "Stopping PM2"
npx pm2 stop dpi-api || true

echo "Deleting database to force recreation"
cd /home/adminbackend/web/demoplace.my.id/public_html/backend
rm -f netify_data.db netify_data.db-wal netify_data.db-shm

echo "Restarting PM2"
npx pm2 restart dpi-api

echo "Done"
`;

conn.on('ready', () => {
  console.log('Connected to server. Executing script...');
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Script finished with code ' + code);
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
