const { Client } = require('ssh2');

const script = `
set -e

echo "=== STOPPING PM2 ==="
npx pm2 stop all
npx pm2 kill

echo "=== RESTORING DB FROM BACKUP ==="
cd /home/adminbackend/web/demoplace.my.id/public_html
rm -f backend/netify_data.db backend/netify_data.db-wal backend/netify_data.db-shm
cp /home/adminbackend/deploy_backup/netify_data.db backend/netify_data.db
# (Also copy WAL if it existed in backup, but usually just .db is enough if WAL was checkpointed, 
#  or copy all of them just in case)
cp /home/adminbackend/deploy_backup/netify_data.db-wal backend/netify_data.db-wal 2>/dev/null || true
cp /home/adminbackend/deploy_backup/netify_data.db-shm backend/netify_data.db-shm 2>/dev/null || true

echo "=== CHECKING RESTORED DB ==="
sqlite3 backend/netify_data.db "PRAGMA integrity_check;"

echo "=== STARTING PM2 ==="
# Restarting pm2 daemon and processes
PORT=10000 npx pm2 start /home/adminbackend/node20/bin/npm --name "dpi-web" --interpreter /home/adminbackend/node20/bin/node -- start
PORT=3001 npx pm2 start backend/server.js --name "dpi-api" --interpreter /home/adminbackend/node20/bin/node
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
