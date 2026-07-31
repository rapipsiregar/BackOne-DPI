// scripts/diagnose-remote-server.js
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
    console.log('[SSH] Connected for deep diagnosis...');

    await execCmd(ssh, 'grep -rn "Gagal terhubung" /home/adminbackend/ /var/www/ /etc/ 2>/dev/null');
    await execCmd(ssh, 'ls -la /home/adminbackend/web/demoplace.my.id/public_html/');
    await execCmd(ssh, 'cat /home/adminbackend/web/demoplace.my.id/public_html/index.php');
    await execCmd(ssh, '/home/adminbackend/.npm-global/bin/pm2 list');
    await execCmd(ssh, '/home/adminbackend/.npm-global/bin/pm2 logs backone-frontend --lines 30 --raw');
    await execCmd(ssh, 'curl -I http://127.0.0.1:3000/login');
    await execCmd(ssh, 'curl -I http://127.0.0.1:8080/login');
    await execCmd(ssh, 'curl -k -I https://103.185.47.52:8443/login');
    await execCmd(ssh, 'curl -s https://demoplace.my.id/login | head -n 30');

    ssh.end();
  }).connect({ host: CONFIG.host, port: CONFIG.port, username: CONFIG.username, password: CONFIG.password });
}

main().catch(console.error);
