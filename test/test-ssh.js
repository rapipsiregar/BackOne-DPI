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
  console.log('SSH Connection ready.');
  conn.exec('node -v && which node && pwd', (err, stream) => {
    if (err) {
      console.error('Exec error:', err.message);
      conn.end();
      return;
    }
    let out = '';
    let errOut = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => errOut += d);
    stream.on('close', () => {
      console.log('Stdout:', out);
      console.log('Stderr:', errOut);
      conn.end();
    });
  });
}).on('error', (err) => {
  console.error('SSH Error:', err.message);
}).connect(SSH);
