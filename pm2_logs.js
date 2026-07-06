const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmds = `
    export PATH=/home/adminbackend/node22/bin:$PATH
    npx pm2 logs backone-dashboard --lines 50 --nostream
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
