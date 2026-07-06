const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmds = `
    cd /home/adminbackend/web/backend.demoplace.my.id/public_html
    export PATH=/home/adminbackend/node22/bin:$PATH
    
    echo "ALLOWED_ORIGINS=https://backend.demoplace.my.id,http://localhost:3000,http://127.0.0.1:3000" >> .env.local
    
    npx pm2 restart backone-dashboard
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
