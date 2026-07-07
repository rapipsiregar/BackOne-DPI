const { Client } = require('ssh2');

const script = `
curl -s -o /dev/null -w "%{http_code}" http://localhost:10000/_next/static/chunks/0rnuuzend4b1r.css
echo ""
curl -s -o /dev/null -w "%{http_code}" http://localhost:10000/
echo ""
`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect({
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH'
});
