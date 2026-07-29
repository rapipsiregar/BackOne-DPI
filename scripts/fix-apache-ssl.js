// scripts/fix-apache-ssl.js
// ─────────────────────────────────────────────────────────────────────────────
// BackOne DPI — Fix Apache HTTPS 502 Bad Gateway
// The SSL VirtualHost needs mod_proxy configuration.
// cPanel uses Apache with .htaccess for proxy rules, but SSL VirtualHost
// may need specific directives to enable mod_proxy_http for the [P] flag.
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const { Client: SshClient } = require('ssh2');

const CONFIG = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
};

const ROOT = '/home/adminbackend/web/demoplace.my.id/public_html';
const PM2  = '/home/adminbackend/.npm-global/bin/pm2';

const COMMANDS = [
  // Investigate Apache config for SSL
  `echo "=== APACHE MODULES ===" && apache2ctl -M 2>/dev/null | grep -i proxy | head -10 || httpd -M 2>/dev/null | grep -i proxy | head -10 || echo "Cannot check Apache modules"`,

  // Check what's actually at the SSL port - is it Apache or Nginx or something else?
  `echo "=== SSL PORT OWNER ===" && ss -tlnp | grep 443`,

  // Check SSL log for 502 cause
  `echo "=== SSL ACCESS LOG (last 10 502s) ===" && tail -50 /home/adminbackend/logs/demoplace.my.id-ssl_log 2>/dev/null | grep "502" | tail -10 || echo "No SSL log or no 502s in log"`,
  `echo "=== SSL ERROR LOG (last 15) ===" && tail -15 /home/adminbackend/logs/demoplace.my.id-ssl_log 2>/dev/null || echo "No SSL log found"`,

  // Find all log files for this domain
  `echo "=== DOMAIN LOG FILES ===" && ls /home/adminbackend/logs/*demoplace* 2>/dev/null || echo "No domain-specific logs"`,

  // Check Apache vhost config (cPanel stores them here)
  `echo "=== APACHE SSL VHOST ===" && cat /etc/apache2/conf.d/userdata/ssl/2_4/adminbackend/demoplace.my.id/custom_subdirectory.conf 2>/dev/null || ls /etc/apache2/conf.d/userdata/ssl/2_4/adminbackend/ 2>/dev/null || echo "Cannot read Apache vhost config"`,

  // Check all .htaccess files in path
  `echo "=== ROOT HTACCESS ===" && cat ${ROOT}/.htaccess`,

  // Check if mod_proxy is loaded
  `echo "=== MOD_PROXY CHECK ===" && test -f /etc/apache2/mods-enabled/proxy.load && echo "mod_proxy ENABLED" || echo "mod_proxy NOT enabled"`,
  `test -f /etc/apache2/mods-enabled/proxy_http.load && echo "mod_proxy_http ENABLED" || echo "mod_proxy_http NOT enabled"`,

  // The issue may be cPanel's "nobody" user restriction
  // Try using ProxyPass in .htaccess with explicit ProxyPassReverse
  `echo "=== UPDATING .HTACCESS ===" && cat > ${ROOT}/.htaccess << 'EOF'
Options -MultiViews
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Proxy all requests to Next.js (port 3000)
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L,QSA]
ProxyPassReverse / http://127.0.0.1:3000/
EOF
echo ".htaccess updated"`,

  // Read the new .htaccess to verify
  `echo "=== NEW HTACCESS ===" && cat ${ROOT}/.htaccess`,

  // Wait a moment for Apache to pick up changes
  `sleep 2`,

  // Test from server itself via HTTPS
  `echo "=== HTTPS TEST FROM SERVER ===" && curl -sk -o /dev/null -w "HTTP %{http_code}" https://demoplace.my.id/ 2>&1`,
  `echo "=== HTTPS LOGIN FROM SERVER ===" && curl -sk -o /dev/null -w "HTTP %{http_code}" https://demoplace.my.id/login 2>&1`,

  // Check if it's a proxy timeout issue - try with verbose curl
  `echo "=== VERBOSE HTTPS TEST ===" && curl -skv https://demoplace.my.id/ 2>&1 | grep -E "(<|>|\\*) " | head -20`,

  // Alternative: check if cPanel has a NodeJS app manager entry interfering
  `echo "=== CPANEL USERDATA ===" && ls /home/adminbackend/.cpanel/userdata/ 2>/dev/null`,
  `cat /home/adminbackend/.cpanel/userdata/demoplace.my.id_SSL 2>/dev/null | head -30 || echo "No cPanel userdata for SSL"`,
  `cat /home/adminbackend/.cpanel/userdata/demoplace.my.id 2>/dev/null | head -30 || echo "No cPanel userdata"`,

  // Check Apache logs specifically for proxy errors
  `echo "=== APACHE ERROR LOG ===" && tail -20 /var/log/apache2/error.log 2>/dev/null | grep -i "demoplace\|proxy\|502" | head -10 || echo "Cannot read Apache error log"`,

  // PM2 processes still healthy?
  `echo "=== PM2 STATUS ===" && ${PM2} list`,
  `echo "=== FRONTEND HEALTH ===" && curl -s -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:3000/login`,
];

function runSsh(commands) {
  return new Promise((resolve, reject) => {
    const ssh = new SshClient();
    ssh.on('ready', () => {
      let i = 0;
      function next() {
        if (i >= commands.length) { ssh.end(); return; }
        const cmd = commands[i++];
        console.log(`\n$ ${cmd.substring(0, 100)}${cmd.length > 100 ? '...' : ''}`);
        ssh.exec(cmd, (err, stream) => {
          if (err) { console.error('[ERR]', err.message); next(); return; }
          stream.on('data', d => process.stdout.write(d.toString()));
          stream.stderr.on('data', d => { const t = d.toString(); if (!t.includes('npm warn') && !t.includes('notice')) process.stdout.write(t); });
          stream.on('close', next);
        });
      }
      next();
      ssh.on('end', resolve);
    });
    ssh.on('error', reject);
    ssh.connect({ ...CONFIG, readyTimeout: 30000 });
  });
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   BackOne DPI — Fix Apache HTTPS 502 Bad Gateway        ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  await runSsh(COMMANDS);
  console.log('\n✅ Apache SSL investigation complete!\n');
}

main().catch(err => { console.error('[FATAL]', err); process.exit(1); });
