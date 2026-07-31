// scripts/clean-remote-backup-files.js
const { Client } = require('ssh2');

const CONFIG = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
};

async function main() {
  const ssh = new Client();
  ssh.on('ready', () => {
    console.log('[SSH] Connected. Removing old backup files...');
    const cmd = 'rm -f /home/adminbackend/web/demoplace.my.id/public_html/*.bak /home/adminbackend/web/demoplace.my.id/public_html/*~ && echo "Backup files removed cleanly"';
    ssh.exec(cmd, (err, stream) => {
      if (err) throw err;
      stream.on('data', (d) => process.stdout.write(d));
      stream.on('close', () => {
        ssh.end();
      });
    });
  }).connect({ host: CONFIG.host, port: CONFIG.port, username: CONFIG.username, password: CONFIG.password });
}

main().catch(console.error);
