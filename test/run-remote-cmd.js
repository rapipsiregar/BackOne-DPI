// test/run-remote-cmd.js
const { Client } = require('ssh2');

const CONFIG = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
};

const cmd = process.argv.slice(2).join(' ') || 'ls -la';

function run() {
  const conn = new Client();
  conn.on('ready', () => {
    console.log(`[SSH] Connected. Running: "${cmd}"\n`);
    conn.exec(cmd, (err, stream) => {
      if (err) {
        console.error('Exec error:', err.message);
        conn.end();
        return;
      }
      stream.on('data', (data) => {
        process.stdout.write(data.toString());
      });
      stream.stderr.on('data', (data) => {
        process.stderr.write(data.toString());
      });
      stream.on('close', (code, signal) => {
        console.log(`\n[SSH] Command exited with code: ${code}`);
        conn.end();
      });
    });
  }).on('error', (err) => {
    console.error('SSH Error:', err.message);
  }).connect({
    host: CONFIG.host,
    port: CONFIG.port,
    username: CONFIG.username,
    password: CONFIG.password,
  });
}

run();
