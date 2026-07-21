// scripts/upload-profile-pictures.js
// Upload semua foto profil dari lokal ke server production
'use strict';
const SftpClient = require('ssh2-sftp-client');
const { Client: SshClient } = require('ssh2');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 30000,
  retries: 3,
  retry_factor: 2,
  retry_minTimeout: 2000,
};
const LOCAL_DIR  = path.join(__dirname, '..', 'backend', 'public', 'api', 'uploads');
const REMOTE_DIR = '/home/adminbackend/web/demoplace.my.id/public_html/api/uploads';

function sshExec(cmd) {
  return new Promise((resolve, reject) => {
    const conn = new SshClient();
    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) { conn.end(); return reject(err); }
        let out = '';
        stream
          .on('data', d => { out += d; })
          .stderr.on('data', d => { out += d; });
        stream.on('close', () => { conn.end(); resolve(out); });
      });
    }).on('error', reject)
      .connect({ host: CONFIG.host, port: CONFIG.port, username: CONFIG.username, password: CONFIG.password, readyTimeout: CONFIG.readyTimeout });
  });
}

async function main() {
  if (!fs.existsSync(LOCAL_DIR)) {
    console.log('Folder uploads lokal tidak ditemukan:', LOCAL_DIR);
    return;
  }

  const files = fs.readdirSync(LOCAL_DIR).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
  if (files.length === 0) {
    console.log('Tidak ada file gambar di folder uploads lokal.');
    return;
  }

  console.log(`Ditemukan ${files.length} file foto profil untuk diupload:\n ${files.join('\n ')}\n`);

  // Buat direktori di server jika belum ada
  await sshExec(`mkdir -p ${REMOTE_DIR} && chmod 755 ${REMOTE_DIR}`);
  console.log(`[Server] Direktori ${REMOTE_DIR} siap\n`);

  // Upload semua file via SFTP
  const sftp = new SftpClient();
  await sftp.connect(CONFIG);
  console.log('[SFTP] Terhubung ke server\n');

  let uploaded = 0;
  let failed = 0;

  for (const file of files) {
    const localPath  = path.join(LOCAL_DIR, file);
    const remotePath = `${REMOTE_DIR}/${file}`;
    try {
      await sftp.put(localPath, remotePath);
      console.log(`✅ Upload: ${file}`);
      uploaded++;
    } catch (err) {
      console.error(`❌ Gagal upload ${file}:`, err.message);
      failed++;
    }
  }

  await sftp.end();

  // Verifikasi
  const remoteList = await sshExec(`ls -lh ${REMOTE_DIR}`);
  console.log('\n[Server] Isi folder uploads:\n' + remoteList);

  console.log(`\n✅ Selesai! ${uploaded} berhasil, ${failed} gagal.`);
}

main().catch(e => console.error('[FATAL]', e.message));
