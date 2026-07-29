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

  // Copy fonts directory to public_html root
  const copyRes = await runCmd('cp -r /home/adminbackend/web/demoplace.my.id/public_html/public/fonts /home/adminbackend/web/demoplace.my.id/public_html/ && echo "Copy successful" || echo "Copy failed"');
  console.log('=== COPY FONTS ===\n', copyRes);

  const checkFile = await runCmd('ls -la /home/adminbackend/web/demoplace.my.id/public_html/fonts/BackOneLogo-Regular.ttf');
  console.log('=== CHECK FILE ===\n', checkFile);

  conn.end();
}

main().catch(console.error);
