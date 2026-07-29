const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const cmd = [
    'export PM2=/home/adminbackend/.npm-global/bin/pm2',
    '$PM2 list',
    'echo "=== MEMORY ==="',
    'free -m',
    'echo "=== DISK ==="',
    'df -h /',
    'echo "=== FRONTEND LOGS ==="',
    '$PM2 logs backone-frontend --lines 20 --nostream 2>&1',
    'echo "=== BACKEND LOGS ==="',
    '$PM2 logs backone-backend --lines 10 --nostream 2>&1',
  ].join(' && ');

  conn.exec(cmd, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
});

conn.on('error', e => console.error('SSH Error:', e.message));
