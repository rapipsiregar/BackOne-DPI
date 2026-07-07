const { Client } = require('ssh2');

const script = `
set -e
export PATH=/home/adminbackend/node20/bin:$PATH
cd /home/adminbackend/web/demoplace.my.id/public_html/backend
echo "=== STOPPING API TO PREVENT WRITES ==="
npx pm2 stop dpi-api || true

echo "=== FIXING CORS IN .env.local ==="
sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://backend.demoplace.my.id,http://backend.demoplace.my.id,https://demoplace.my.id,http://demoplace.my.id|g" /home/adminbackend/web/demoplace.my.id/public_html/.env.local

echo "=== BACKING UP CORRUPTED DB ==="
cp netify_data.db netify_data_corrupted.db
echo "=== DUMPING CORRUPTED DB TO SQL ==="
sqlite3 netify_data.db ".recover" > recovery.sql || echo "Recovery completed with some warnings"
echo "=== REBUILDING DB ==="
rm netify_data.db
sqlite3 netify_data.db < recovery.sql
rm recovery.sql

echo "=== RESTARTING API ==="
npx pm2 start dpi-api
`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('Script finished with code ' + code);
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
