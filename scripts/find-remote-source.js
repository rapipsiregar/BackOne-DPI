const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`find /home/adminbackend/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" | xargs grep -l "Overview Dashboard" 2>/dev/null`, (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log('=== FILES CONTAINING Overview Dashboard ===\n' + out);
      conn.end();
    });
  });
}).connect({
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH'
});
