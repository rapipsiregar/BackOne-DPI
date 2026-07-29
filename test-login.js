// test-login.js — Test berbagai credentials login di production
const { Client } = require('ssh2');

const SSH_CONFIG = {
  host: '103.185.47.52', port: 2222,
  username: 'adminbackend', password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 20000,
};

const SCRIPT = `
echo "=== Test Login Credentials ==="

test_login() {
  local user=$1
  local pass=$2
  result=$(curl -s -X POST http://127.0.0.1:3011/api/auth/login \\
    -H "Content-Type: application/json" \\
    -d "{\\"username\\":\\"$user\\",\\"password\\":\\"$pass\\"}" \\
    --max-time 10 2>/dev/null)
  echo "[$user / $pass] → $result"
}

test_login "office" "office"
test_login "siab" "siab"
test_login "admin" "admin"
test_login "siab" "siab123"
test_login "admin" "admin123"
test_login "office" "office123"

echo ""
echo "=== Check users in MongoDB via backend logs ==="
export PATH="$HOME/.npm-global/bin:$PATH"
PM2="$HOME/.npm-global/bin/pm2"
$PM2 logs source2-backend --lines 50 --nostream 2>/dev/null | grep -E "Seeded|Created|user|admin|siab|office|tenant" | head -20
`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`bash -c '${SCRIPT.replace(/'/g, "'\"'\"'")}'`, (err, stream) => {
    if (err) { console.error(err); return; }
    stream.on('close', (code) => { console.log(`\n[Exit: ${code}]`); conn.end(); });
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
  });
});
conn.on('error', (e) => console.error('[SSH Error]', e.message));
conn.connect(SSH_CONFIG);
