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
        stream.stderr.on('data', d => out += `[stderr] ${d}`);
        stream.on('close', () => resolve(out.trim()));
      });
    });
  };

  const gitLog = await runCmd('cd /home/adminbackend/web/demoplace.my.id/public_html && git log -n 5 --oneline');
  console.log('=== GIT LOG REMOTE ===\n', gitLog);

  const gitStatus = await runCmd('cd /home/adminbackend/web/demoplace.my.id/public_html && git status');
  console.log('=== GIT STATUS REMOTE ===\n', gitStatus);

  conn.end();
}

main().catch(console.error);
