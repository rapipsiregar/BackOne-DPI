module.paths.unshift('c:\\Users\\demo\\Downloads\\Deep Package Inspection\\node_modules');
const { Client } = require('ssh2');

const SSH = { host: '103.185.47.52', port: 2222, username: 'adminbackend', password: 'htEo7x6LsBQiEHHH', readyTimeout: 60000 };

async function main() {
  const conn = new Client();
  await new Promise((resolve, reject) => {
    conn.on('ready', resolve).on('error', reject).connect(SSH);
  });
  console.log('SSH connected.');

  const runCmd = (cmd) => {
    return new Promise((resolve) => {
      conn.exec(cmd, (err, stream) => {
        if (err) { resolve(`Err: ${err.message}`); return; }
        let out = '';
        stream.on('data', d => out += d);
        stream.on('close', () => resolve(out.trim()));
      });
    });
  };

  const findConf = await runCmd('find /home/adminbackend -name "*nginx*.conf" -o -name "nginx.conf" 2>/dev/null');
  console.log('=== NGINX CONFS ===\n', findConf);

  const nginxV = await runCmd('nginx -t 2>&1 || cat /etc/nginx/nginx.conf 2>/dev/null || echo "No nginx read access"');
  console.log('=== NGINX CONF OR STATUS ===\n', nginxV.substring(0, 1500));

  conn.end();
}

main().catch(console.error);
