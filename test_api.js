const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  conn.exec('curl -s http://127.0.0.1:3001/api/dashboard | cut -c 1-200', (err, stream) => {
    let data = '';
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log(data);
      conn.end();
    }).on('data', (d) => {
      data += d;
    }).stderr.on('data', (d) => {
      process.stderr.write(d);
    });
  });
}).on('error', (err) => {
  console.error('SSH Error:', err);
}).connect({
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH'
});
