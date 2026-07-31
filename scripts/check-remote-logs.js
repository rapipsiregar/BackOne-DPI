const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Client Ready');
  const cmd = `tail -n 200 /home/adminbackend/.pm2/logs/backone-backend-error-*.log /home/adminbackend/.pm2/logs/backone-backend-out-*.log /home/adminbackend/.pm2/logs/backone-frontend-error-*.log /home/adminbackend/.pm2/logs/backone-frontend-out-*.log 2>/dev/null | tail -n 200`;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      console.log(data.toString());
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data.toString());
    });
  });
}).connect({
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH'
});
