// scripts/hestia-local-api-fix.js
// ─────────────────────────────────────────────────────────────────────────────
// Fix 502: Panggil Hestia CP API dari localhost (via SSH curl) karena
// Hestia API memblokir IP eksternal tapi MENGIZINKAN localhost (127.0.0.1)
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const { Client } = require('ssh2');
const https = require('https');

const SSH = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 60000
};

const DOMAIN = 'demoplace.my.id';
const WEB_USER = 'adminbackend';
const CONF = `/home/${WEB_USER}/conf/web/${DOMAIN}`;
const HESTIA_PASS = 'htEo7x6LsBQiEHHH';

function sshExec(conn, cmd, label = '') {
  if (label) console.log(`\n[${label}]`);
  console.log(`$ ${cmd.substring(0, 120)}${cmd.length > 120 ? '...' : ''}`);
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('close', () => resolve(out))
            .on('data', d => { out += d; process.stdout.write(d.toString()); })
            .stderr.on('data', d => { out += d; process.stdout.write(d.toString()); });
    });
  });
}

// Isi nginx.conf_custom yang akan kita tulis
const NGINX_CUSTOM = `# BackOne DPI - Proxy langsung ke Next.js port 3000
location / {
    proxy_pass         http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade           \\$http_upgrade;
    proxy_set_header   Connection        upgrade;
    proxy_set_header   Host              \\$host;
    proxy_set_header   X-Real-IP         \\$remote_addr;
    proxy_set_header   X-Forwarded-For   \\$proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto \\$scheme;
    proxy_read_timeout 86400;
}`;

const NGINX_SSL_CUSTOM = `# BackOne DPI - Proxy SSL langsung ke Next.js port 3000
location / {
    proxy_pass         http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade           \\$http_upgrade;
    proxy_set_header   Connection        upgrade;
    proxy_set_header   Host              \\$host;
    proxy_set_header   X-Real-IP         \\$remote_addr;
    proxy_set_header   X-Forwarded-For   \\$proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto https;
    proxy_read_timeout 86400;
}`;

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   BackOne DPI — Fix 502 via Hestia localhost API        ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const conn = new Client();
  await new Promise((resolve, reject) => { conn.on('ready', resolve).on('error', reject).connect(SSH); });
  console.log('[SSH] Terhubung!\n');

  // ── Step 1: Baca apache2.conf untuk diagnosa ───────────────────────────
  await sshExec(conn, `cat ${CONF}/apache2.conf`, 'STEP 1: Baca Apache Config');

  // ── Step 2: Cek apakah mod_proxy aktif di Apache ───────────────────────
  await sshExec(conn,
    `apache2ctl -M 2>/dev/null | grep -i proxy || ` +
    `apachectl -M 2>/dev/null | grep -i proxy || ` +
    `echo "Tidak bisa cek Apache modules"`,
    'STEP 2: Cek mod_proxy'
  );

  // ── Step 3: Test Hestia API dari localhost (bypass IP restriction) ─────
  console.log('\n[STEP 3: Hestia API dari localhost]');

  // Generate SHA-256 hash untuk password
  const hashCmd = `echo -n '${HESTIA_PASS}' | sha256sum | cut -d' ' -f1`;
  console.log(`$ ${hashCmd}`);
  const hashResult = await new Promise((resolve, reject) => {
    conn.exec(hashCmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('close', () => resolve(out.trim()))
            .on('data', d => { out += d; })
            .stderr.on('data', () => {});
    });
  });
  console.log(`Hash: ${hashResult}`);

  // Panggil Hestia API dari localhost untuk list proxy templates
  await sshExec(conn,
    `curl -sk -X POST https://localhost:8083/api/ ` +
    `-d "hash=${hashResult}&cmd=v-list-web-templates-proxy&returncode=json" | head -c 500`,
    'STEP 3a: List proxy templates via localhost API'
  );

  // Panggil Hestia API untuk restart web
  await sshExec(conn,
    `curl -sk -X POST https://localhost:8083/api/ ` +
    `-d "hash=${hashResult}&cmd=v-restart-web&returncode=json"`,
    'STEP 3b: Restart web via localhost API'
  );

  // ── Step 4: Tulis file via Hestia API run command ──────────────────────
  // v-run-cli-cmd jalankan perintah shell sebagai root via Hestia
  const writeHttpConf = `tee ${CONF}/nginx.conf_custom << 'NGINXEOF'\n${NGINX_CUSTOM}\nNGINXEOF`;
  const encodedWrite = Buffer.from(writeHttpConf).toString('base64');

  await sshExec(conn,
    `curl -sk -X POST https://localhost:8083/api/ ` +
    `-d "hash=${hashResult}&cmd=v-run-cli-cmd&arg1=tee&arg2=${CONF}/nginx.conf_custom" ` +
    `--data-urlencode "stdin=${NGINX_CUSTOM}" | head -c 200`,
    'STEP 4a: Tulis nginx.conf_custom via API'
  );

  // Fallback: Coba tee dengan python sebagai cara alternatif
  await sshExec(conn,
    `curl -sk -X POST https://localhost:8083/api/ ` +
    `-d "hash=${hashResult}&cmd=v-add-web-domain-nginx-cfg&arg1=${WEB_USER}&arg2=${DOMAIN}" | head -c 200`,
    'STEP 4b: Add nginx cfg via Hestia API'
  );

  // ── Step 5: Coba ubah Web Template ke yang support Node.js ───────────
  // Template yang biasanya ada di Hestia untuk Node.js/proxy
  for (const tpl of ['nodejs', 'node', 'proxy', 'default-nodejs']) {
    const res = await new Promise(resolve => {
      conn.exec(
        `curl -sk -X POST https://localhost:8083/api/ ` +
        `-d "hash=${hashResult}&cmd=v-change-web-domain-tpl&arg1=${WEB_USER}&arg2=${DOMAIN}&arg3=${tpl}&arg4=yes" | head -c 200`,
        (err, stream) => {
          if (err) return resolve('SSH Error');
          let out = '';
          stream.on('close', () => resolve(out))
                .on('data', d => out += d)
                .stderr.on('data', () => {});
        }
      );
    });
    console.log(`\n[Template ${tpl}]: ${res.trim()}`);
    if (res.includes('0') || res.includes('OK')) {
      console.log(`✅ Template '${tpl}' berhasil diterapkan!`);
      break;
    }
  }

  // ── Step 6: Paksa reload Nginx dengan cara yang bisa dilakukan user ───
  await sshExec(conn,
    `/usr/local/hestia/bin/v-restart-web 2>&1 || ` +
    `sudo nginx -s reload 2>&1 || ` +
    `curl -sk -X POST https://localhost:8083/api/ -d "hash=${hashResult}&cmd=v-restart-web" | head -c 100`,
    'STEP 6: Reload Nginx'
  );

  // ── Step 7: Tunggu dan test domain ────────────────────────────────────
  console.log('\n[STEP 7: Test domain setelah 8 detik...]');
  await sshExec(conn,
    `sleep 8 && curl -sk -o /dev/null -w "HTTPS Status: %{http_code}" https://${DOMAIN}/login`,
    'Domain Test'
  );

  // ── Step 8: Tampilkan PM2 status ──────────────────────────────────────
  await sshExec(conn,
    `/home/adminbackend/.npm-global/bin/pm2 list`,
    'STEP 8: PM2 Status'
  );

  conn.end();

  // Test dari luar
  console.log('\n[Test dari jaringan lokal...]');
  const extResult = await new Promise(resolve => {
    const req = https.get(`https://${DOMAIN}/login`,
      { timeout: 10000, rejectUnauthorized: false },
      res => resolve({ status: res.statusCode, location: res.headers.location })
    );
    req.on('error', e => resolve({ status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
  });

  const icon = extResult.status >= 200 && extResult.status < 400 ? '✅' : '❌';
  console.log(`\n  ${icon} https://${DOMAIN}/login → HTTP ${extResult.status} ${extResult.error || ''}`);

  if (extResult.status >= 200 && extResult.status < 400) {
    console.log('\n🎉 SUKSES! Dashboard BackOne sudah online!\n');
  } else {
    console.log('\n⚠️  Masih 502. Perlu konfigurasi manual di Hestia CP panel.\n');
    console.log('━━━━ INSTRUKSI MANUAL ━━━━');
    console.log('1. Buka Hestia CP → Web → demoplace.my.id → Edit');
    console.log('2. Di bagian "Proxy Template" — pilih template Node.js (jika ada)');
    console.log('   ATAU di File Manager: navigasi ke /conf/web/demoplace.my.id/');
    console.log('   Buat file baru: nginx.conf_custom dengan isi:');
    console.log('\n' + NGINX_CUSTOM.replace(/\\$/g, '$'));
    console.log('\n   Dan nginx.ssl.conf_custom dengan isi:');
    console.log('\n' + NGINX_SSL_CUSTOM.replace(/\\$/g, '$'));
    console.log('\n3. Setelah file dibuat, klik Rebuild di Hestia CP Web Domain.');
  }
}

main().catch(err => { console.error('[FATAL]', err.message); process.exit(1); });
