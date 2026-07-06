const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmds = `curl -X POST http://127.0.0.1:8018/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"password"}'`;
  conn.exec(cmds, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).connect({
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH'
});
