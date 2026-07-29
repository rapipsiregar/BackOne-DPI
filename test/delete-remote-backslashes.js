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
  console.log('Cleaning up backslash files/folders on remote server...');
  conn.exec("find /home/adminbackend/web/demoplace.my.id/public_html -name '*\\\\*' -depth -exec rm -rf {} \\; -print", (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log('--- CLEANED UP REMOTE FILES ---');
      console.log(out);
      conn.end();
    });
  });
}).connect(SSH);
