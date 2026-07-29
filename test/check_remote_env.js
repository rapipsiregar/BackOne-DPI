// test/check_remote_env.js
// Fix 502: Write Nginx custom config to proxy directly to Next.js port 3000
'use strict';
const { Client } = require('ssh2');

const sshConfig = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 60000
};

function runSSHCommand(conn, cmd) {
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

async function main() {
  const conn = new Client();
  await new Promise((resolve, reject) => {
    conn.on('ready', resolve).on('error', reject).connect(sshConfig);
  });
  console.log('[SSH] Connected!\n');

  const CONF = '/home/adminbackend/conf/web/demoplace.my.id';

  // The Nginx config includes nginx.conf_custom and nginx.ssl.conf_custom
  // We override the location / block to proxy directly to Next.js port 3000
  const httpCustom = [
    '# BackOne DPI — Direct proxy to Next.js',
    'location / {',
    '    proxy_pass         http://127.0.0.1:3000;',
    '    proxy_http_version 1.1;',
    '    proxy_set_header   Upgrade           $http_upgrade;',
    '    proxy_set_header   Connection        "upgrade";',
    '    proxy_set_header   Host              $host;',
    '    proxy_set_header   X-Real-IP         $remote_addr;',
    '    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;',
    '    proxy_set_header   X-Forwarded-Proto $scheme;',
    '    proxy_read_timeout 86400;',
    '}',
  ].join('\n');

  const sslCustom = [
    '# BackOne DPI — Direct SSL proxy to Next.js',
    'location / {',
    '    proxy_pass         http://127.0.0.1:3000;',
    '    proxy_http_version 1.1;',
    '    proxy_set_header   Upgrade           $http_upgrade;',
    '    proxy_set_header   Connection        "upgrade";',
    '    proxy_set_header   Host              $host;',
    '    proxy_set_header   X-Real-IP         $remote_addr;',
    '    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;',
    '    proxy_set_header   X-Forwarded-Proto https;',
    '    proxy_read_timeout 86400;',
    '}',
  ].join('\n');

  const commands = [
    // Write HTTP custom config
    `printf '%s\n' ${JSON.stringify(httpCustom)} > ${CONF}/nginx.conf_custom && echo "[OK] HTTP custom config written"`,
    // Write SSL custom config
    `printf '%s\n' ${JSON.stringify(sslCustom)} > ${CONF}/nginx.ssl.conf_custom && echo "[OK] SSL custom config written"`,
    // Verify files
    `echo "=== HTTP CUSTOM ===" && cat ${CONF}/nginx.conf_custom`,
    `echo "=== SSL CUSTOM ===" && cat ${CONF}/nginx.ssl.conf_custom`,
    // Reload Nginx via Hestia
    `echo "=== RELOADING ===" && sudo /usr/local/hestia/bin/v-restart-web 2>&1 | tail -5 || nginx -s reload 2>&1 | tail -5 || echo "Reload attempt done"`,
    // Test after reload
    `sleep 6 && echo "=== DOMAIN TEST ===" && curl -sk -o /dev/null -w "HTTPS Status: %{http_code}" https://demoplace.my.id/login`,
  ];

  for (const cmd of commands) {
    console.log(`\n$ ${cmd.substring(0, 100)}${cmd.length > 100 ? '...' : ''}`);
    await runSSHCommand(conn, cmd);
  }

  conn.end();
  console.log('\n\n✅ Selesai! Cek https://demoplace.my.id/login di browser.\n');
}

main().catch(err => { console.error('[FATAL]', err.message); process.exit(1); });
