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
  conn.exec("cat /home/adminbackend/conf/web/demoplace.my.id/apache2.ssl.conf", (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log('--- REMOTE APACHE SSL CONF CONTENT ---');
      console.log(out);
      conn.end();
    });
  });
}).connect(SSH);
