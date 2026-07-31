// scripts/tdd-static-asset-test.js
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
    console.log('[TDD TEST] Verifying all static JS/CSS assets over HTTPS...');
    const cmd = `
      HTML=$(curl -s https://demoplace.my.id/login)
      SCRIPTS=$(echo "$HTML" | grep -o 'src="[^"]*"' | cut -d'"' -f2)
      STYLES=$(echo "$HTML" | grep -o 'href="[^"]*"' | cut -d'"' -f2)

      echo "=== Script Assets ==="
      FAIL=0
      for s in $SCRIPTS; do
        if [[ $s == /_next/* ]]; then
          CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://demoplace.my.id$s")
          echo "$s -> HTTP $CODE"
          if [ "$CODE" != "200" ]; then FAIL=1; fi
        fi
      done

      echo "=== Style Assets ==="
      for css in $STYLES; do
        if [[ $css == /_next/* ]]; then
          CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://demoplace.my.id$css")
          echo "$css -> HTTP $CODE"
          if [ "$CODE" != "200" ]; then FAIL=1; fi
        fi
      done

      if [ $FAIL -eq 0 ]; then
        echo "\n[TDD TEST RESULT: PASS] All static JS and CSS assets return HTTP 200 OK!"
      else
        echo "\n[TDD TEST RESULT: FAIL] One or more assets failed!"
        exit 1
      fi
    `;

    ssh.exec(cmd, (err, stream) => {
      if (err) throw err;
      let exitCode = 0;
      stream.on('data', (d) => process.stdout.write(d));
      stream.on('exit', (code) => { exitCode = code; });
      stream.on('close', () => {
        ssh.end();
        if (exitCode !== 0) process.exit(1);
      });
    });
  }).connect({ host: CONFIG.host, port: CONFIG.port, username: CONFIG.username, password: CONFIG.password });
}

main().catch(console.error);
