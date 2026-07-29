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
  console.log('Searching for Nginx configurations under home directory...');
  conn.exec("find /home/adminbackend -name '*nginx*.conf' -o -name 'nginx.ssl.conf' 2>/dev/null", (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log('--- REMOTE NGINX CONFIGS ---');
      console.log(out);
      conn.end();
    });
  });
}).connect(SSH);
