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

  const remoteNodeCmd = `const mongoose = require('/home/adminbackend/web/demoplace.my.id/public_html/proxy/node_modules/mongoose'); mongoose.connect('mongodb://127.0.0.1:27017/backone_dpi').then(() => mongoose.connection.db.collection('lookupapps').countDocuments()).then(c => { console.log('COUNT:', c); process.exit(0); }).catch(e => { console.error(e); process.exit(1); })`;

  const countRes = await runCmd(`node -e ${JSON.stringify(remoteNodeCmd)}`);
  console.log('=== REMOTE LOOKUP COUNT ===\n', countRes);

  conn.end();
}

main().catch(console.error);
