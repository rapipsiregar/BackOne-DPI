const { Client } = require('ssh2');

const SSH = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 60000
};

const conn = new Client();
conn.on('ready', () => {
  console.log('Querying remote Nginx config and PM2 details...');
  conn.exec("cat /etc/nginx/conf.d/*.conf /etc/nginx/sites-enabled/* /etc/nginx/nginx.conf 2>/dev/null | grep -i -A 10 -B 2 'demoplace.my.id'; /home/adminbackend/.npm-global/bin/pm2 env 2", (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log('--- REMOTE NGINX & PM2 ENV ---');
      console.log(out);
      conn.end();
    });
  });
}).connect(SSH);
