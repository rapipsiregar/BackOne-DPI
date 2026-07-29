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
  conn.exec('cat /home/adminbackend/web/demoplace.my.id/public_html/proxy/.env /home/adminbackend/web/demoplace.my.id/public_html/backend/.env /home/adminbackend/web/demoplace.my.id/public_html/.env.production', (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log('--- REMOTE ENVS ---');
      console.log(out);
      conn.end();
    });
  });
}).on('error', console.error).connect(SSH);
