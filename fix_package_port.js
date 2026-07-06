const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmds = `
    cd /home/adminbackend/web/backend.demoplace.my.id/public_html
    export PATH=/home/adminbackend/node22/bin:$PATH
    
    # Fix start:prod script
    sed -i 's/"start:prod": "concurrently \\\\"next start\\\\""/"start:prod": "concurrently \\\\"next start -p 8018\\\\""/g' package.json
    
    # Restart PM2
    npx pm2 restart backone-dashboard
    sleep 5
    curl -I -k https://backend.demoplace.my.id/login
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
