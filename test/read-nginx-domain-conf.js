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

  // Find Nginx confs for demoplace.my.id
  const findConf = await runCmd('find /etc/nginx/ -name "*demoplace*" 2>/dev/null || echo "No find access"');
  console.log('=== FIND DEMOPLACE NGINX ===\n', findConf);

  const confContent = await runCmd('cat /etc/nginx/conf.d/domains/demoplace.my.id.conf || cat /etc/nginx/sites-enabled/demoplace.my.id || echo "No read access"');
  console.log('=== DEMOPLACE CONF CONTENT ===\n', confContent);

  conn.end();
}

main().catch(console.error);
