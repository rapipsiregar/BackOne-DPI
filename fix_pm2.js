const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmds = `
    export PATH=/home/adminbackend/node22/bin:$PATH
    cd web/backend.demoplace.my.id/public_html
    npx pm2 kill
    npx pm2 start npm --name "backone-dashboard" -- run start:prod
    npx pm2 save
  `;
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
