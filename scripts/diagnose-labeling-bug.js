// scripts/diagnose-labeling-bug.js
const { Client } = require('ssh2');

const CONFIG = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
};

function execCmd(ssh, cmd) {
  return new Promise((resolve) => {
    console.log(`\n========================================`);
    console.log(`EXEC: ${cmd}`);
    console.log(`========================================`);
    ssh.exec(cmd, (err, stream) => {
      if (err) {
        console.error('Exec error:', err.message);
        return resolve('');
      }
      let out = '';
      stream.on('data', (d) => { out += d; process.stdout.write(d); });
      stream.stderr.on('data', (d) => { out += d; process.stderr.write(d); });
      stream.on('close', () => resolve(out));
    });
  });
}

async function main() {
  const ssh = new Client();
  ssh.on('ready', async () => {
    console.log('[SSH] Connected for targetted diagnosis...');

    const pm2Path = '/home/adminbackend/.npm-global/bin/pm2';
    // 1. List PM2 processes
    await execCmd(ssh, `${pm2Path} list`);
    
    // 2. Fetch last 50 error logs of frontend
    await execCmd(ssh, `${pm2Path} logs backone-frontend --lines 50 --err --raw`);
    
    // 3. Fetch last 50 output logs of frontend
    await execCmd(ssh, `${pm2Path} logs backone-frontend --lines 50 --out --raw`);

    // 4. Check pm2 logs backone-backend or other backend services
    await execCmd(ssh, `${pm2Path} logs backone-backend --lines 50 --err --raw`);

    // 5. Check if the directory next standalone actually contains device-labeling folder
    await execCmd(ssh, `find /home/adminbackend/web/demoplace.my.id/public_html/.next/standalone/.next/server/app -name "device-labeling" || echo "Not found"`);
    await execCmd(ssh, `ls -la /home/adminbackend/web/demoplace.my.id/public_html/.next/standalone/.next/server/app/ || echo "Failed to list app dir"`);

    ssh.end();
  }).connect({ host: CONFIG.host, port: CONFIG.port, username: CONFIG.username, password: CONFIG.password });
}

main().catch(console.error);
