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
  conn.exec("tail -n 50 /home/adminbackend/web/demoplace.my.id/public_html/logs/frontend-out.log; tail -n 50 /home/adminbackend/web/demoplace.my.id/public_html/logs/frontend-error.log", (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log('--- REMOTE FRONTEND LOG FILES ---');
      console.log(out);
      conn.end();
    });
  });
}).connect(SSH);
