const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmds = `
    cd /home/adminbackend/web/backend.demoplace.my.id/public_html
    export PATH=/home/adminbackend/node22/bin:$PATH
    pm2 restart backone-dashboard
  `;
  conn.exec(cmds, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end()).on('data', d => process.stdout.write(d.toString()));
  });
}).connect({
  host: '103.185.47.52', port: 2222, username: 'adminbackend', password: 'htEo7x6LsBQiEHHH'
});
