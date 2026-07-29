// scripts/quick-diag.js
'use strict';
const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmds = [
    'echo "=== Port 3000 test ==" && curl -sk -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:3000/login',
    'echo "" && echo "=== Nginx conf_custom ===" && cat /home/adminbackend/conf/web/demoplace.my.id/nginx.conf_custom 2>/dev/null || echo MISSING',
    'echo "=== Nginx ssl conf_custom ===" && cat /home/adminbackend/conf/web/demoplace.my.id/nginx.ssl.conf_custom 2>/dev/null || echo MISSING',
    'echo "=== .htaccess ===" && cat /home/adminbackend/web/demoplace.my.id/public_html/.htaccess',
    'echo "=== PM2 status ===" && /home/adminbackend/.npm-global/bin/pm2 list 2>/dev/null | grep -E "(name|backone)"',
  ];
  let i = 0;
  function run() {
    if (i >= cmds.length) { conn.end(); console.log('\nDone.'); return; }
    const cmd = cmds[i++];
    conn.exec(cmd, (err, s) => {
      if (err) { console.error(err.message); run(); return; }
      s.on('data', d => process.stdout.write(d.toString()))
       .stderr.on('data', d => process.stdout.write(d.toString()))
       .on('close', run);
    });
  }
  run();
}).on('error', e => console.error(e.message))
  .connect({ host: '103.185.47.52', port: 2222, username: 'adminbackend', password: 'htEo7x6LsBQiEHHH', readyTimeout: 30000 });
