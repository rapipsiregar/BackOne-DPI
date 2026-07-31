// scripts/force-deploy-frontend.js
const SftpClient = require('ssh2-sftp-client');
const { Client: SshClient } = require('ssh2');
const path = require('path');
const fs = require('fs');

const CONFIG = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
  remotePath: '/home/adminbackend/web/demoplace.my.id/public_html',
};

const LOCAL_ROOT = path.resolve(__dirname, '..');

async function uploadDir(sftp, localSub, remoteSub) {
  const localDir = path.join(LOCAL_ROOT, localSub);
  if (!fs.existsSync(localDir)) {
    console.log(`Local dir missing: ${localDir}`);
    return;
  }
  const remoteDir = path.posix.join(CONFIG.remotePath, remoteSub.replace(/\\/g, '/'));
  try {
    await sftp.mkdir(remoteDir, true);
  } catch (e) {}

  const items = fs.readdirSync(localDir, { withFileTypes: true });
  for (const item of items) {
    if (['node_modules', '.git'].includes(item.name)) continue;
    const itemLocal = path.join(localDir, item.name);
    const itemRemote = path.posix.join(remoteDir, item.name);
    const relRemote = path.posix.join(remoteSub, item.name).replace(/\\/g, '/');

    if (item.isDirectory()) {
      await uploadDir(sftp, path.join(localSub, item.name), relRemote);
    } else {
      process.stdout.write(`  [UP] ${relRemote} ... `);
      await sftp.put(itemLocal, itemRemote);
      process.stdout.write('done\n');
    }
  }
}

async function runSsh(cmd) {
  return new Promise((resolve, reject) => {
    const ssh = new SshClient();
    ssh.on('ready', () => {
      console.log(`\n[SSH EXEC] ${cmd}`);
      ssh.exec(cmd, (err, stream) => {
        if (err) return reject(err);
        let out = '';
        stream.on('data', (d) => { out += d; process.stdout.write(d); });
        stream.stderr.on('data', (d) => { out += d; process.stderr.write(d); });
        stream.on('close', () => { ssh.end(); resolve(out); });
      });
    }).connect({ host: CONFIG.host, port: CONFIG.port, username: CONFIG.username, password: CONFIG.password });
  });
}

async function main() {
  console.log('=== FORCE RE-DEPLOYING FRONTEND STANDALONE ===');
  
  // 1. Stop PM2 backone-frontend first to unlock files
  await runSsh('/home/adminbackend/.npm-global/bin/pm2 stop backone-frontend || true');
  
  // 2. Upload .next/standalone recursively
  const sftp = new SftpClient();
  console.log('\nConnecting SFTP...');
  await sftp.connect({ host: CONFIG.host, port: CONFIG.port, username: CONFIG.username, password: CONFIG.password });
  
  console.log('\nUploading .next/standalone...');
  await uploadDir(sftp, '.next/standalone', '.next/standalone');
  
  console.log('\nUploading .next/static...');
  await uploadDir(sftp, '.next/static', '.next/static');

  console.log('\nUploading public...');
  await uploadDir(sftp, 'public', 'public');
  
  await sftp.end();
  console.log('SFTP Upload Complete!');

  // 3. Run post commands: Copy static into standalone, restart PM2
  const cmds = [
    'mkdir -p /home/adminbackend/web/demoplace.my.id/public_html/.next/standalone/.next/',
    'cp -r /home/adminbackend/web/demoplace.my.id/public_html/.next/static /home/adminbackend/web/demoplace.my.id/public_html/.next/standalone/.next/static',
    'cp -r /home/adminbackend/web/demoplace.my.id/public_html/public /home/adminbackend/web/demoplace.my.id/public_html/.next/standalone/public 2>/dev/null || true',
    'ln -sfn /home/adminbackend/web/demoplace.my.id/public_html/.next/standalone/.next /home/adminbackend/web/demoplace.my.id/public_html/_next',
    'ln -sfn /home/adminbackend/web/demoplace.my.id/public_html/.next/standalone/.next/static /home/adminbackend/web/demoplace.my.id/public_html/.next/static',
    '/home/adminbackend/.npm-global/bin/pm2 restart backone-frontend --update-env',
    'sleep 3 && /home/adminbackend/.npm-global/bin/pm2 list',
    'curl -s http://127.0.0.1:3000/login | grep -i "locked"'
  ];

  await runSsh(cmds.join(' && '));
  console.log('\n=== DONE FORCE RE-DEPLOYMENT ===');
}

main().catch(console.error);
