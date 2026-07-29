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
  console.log('Reading PM2 default log files...');
  conn.exec("ls -l ~/.pm2/logs/; tail -n 50 ~/.pm2/logs/backone-frontend-out.log; tail -n 50 ~/.pm2/logs/backone-frontend-error.log", (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log('--- DEFAULT PM2 LOG FILES ---');
      console.log(out);
      conn.end();
    });
  });
}).connect(SSH);
