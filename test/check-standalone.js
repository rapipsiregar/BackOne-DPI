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

  const lsStandalone = await runCmd('ls -la /home/adminbackend/web/demoplace.my.id/public_html/.next/standalone');
  console.log('=== STANDALONE DIR ===\n', lsStandalone);

  const lsStandalonePublic = await runCmd('ls -la /home/adminbackend/web/demoplace.my.id/public_html/.next/standalone/public || echo "No public folder in standalone"');
  console.log('=== STANDALONE PUBLIC DIR ===\n', lsStandalonePublic);

  conn.end();
}

main().catch(console.error);
