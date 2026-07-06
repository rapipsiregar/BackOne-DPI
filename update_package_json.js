const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmds = `
    cd /home/adminbackend/web/backend.demoplace.my.id/public_html
    export PATH=/home/adminbackend/node22/bin:$PATH
    
    node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      pkg.scripts['start:prod'] = 'concurrently \\\\'next start -p 8018\\\\' \\\\'node backend/server.js\\\\'';
      fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
    
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
