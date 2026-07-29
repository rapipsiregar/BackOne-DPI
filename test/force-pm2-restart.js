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

  const restartRes = await runCmd('/home/adminbackend/.npm-global/bin/pm2 restart all');
  console.log('=== PM2 RESTART ALL ===\n', restartRes);

  const pm2List = await runCmd('/home/adminbackend/.npm-global/bin/pm2 list');
  console.log('=== PM2 LIST ===\n', pm2List);

  conn.end();
}

main().catch(console.error);
