const { Client } = require('ssh2');

const SSH = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 60000
};

const conn = new Client();
conn.on('ready', () => {
  console.log('Fetching latest frontend error logs from PM2...');
  conn.exec("tail -n 150 ~/.pm2/logs/backone-frontend-error.log", (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log('--- LATEST FRONTEND ERRORS ---');
      console.log(out);
      conn.end();
    });
  });
}).connect(SSH);
