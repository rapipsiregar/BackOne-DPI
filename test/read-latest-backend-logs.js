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
  console.log('Fetching latest backend logs from PM2 default dir...');
  conn.exec("tail -n 100 ~/.pm2/logs/backone-backend-out.log; tail -n 100 ~/.pm2/logs/backone-backend-error.log", (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log('--- LATEST BACKEND LOGS ---');
      console.log(out);
      conn.end();
    });
  });
}).connect(SSH);
