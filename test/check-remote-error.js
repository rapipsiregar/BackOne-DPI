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
  console.log('Checking PM2 status and errors...');
  conn.exec("/home/adminbackend/.npm-global/bin/pm2 list; tail -n 50 /home/adminbackend/web/demoplace.my.id/public_html/logs/frontend-error.log", (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log('--- PM2 STATUS & FRONTEND ERRORS ---');
      console.log(out);
      conn.end();
    });
  });
}).connect(SSH);
