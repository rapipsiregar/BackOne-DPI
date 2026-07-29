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
  conn.exec("cat /home/adminbackend/web/demoplace.my.id/public_html/start-with-env.js", (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log('--- start-with-env.js CONTENT ---');
      console.log(out);
      conn.end();
    });
  });
}).connect(SSH);
