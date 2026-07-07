const { Client } = require('ssh2');

const script = `
export PATH=/home/adminbackend/node20/bin:$PATH
cd /home/adminbackend/web/demoplace.my.id/public_html
npx pm2 delete dpi-web || true
PORT=10000 npx pm2 start /home/adminbackend/node20/bin/npm --name "dpi-web" -- start
npx pm2 save
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
