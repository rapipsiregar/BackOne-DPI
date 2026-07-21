// test/inspect_remote_structure.js
const { Client } = require('ssh2');

const sshConfig = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH'
};

async function runSSHCommands(commands) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      let combinedCmd = commands.join(' && echo "=== CMD_SEPARATOR ===" && ');
      conn.exec(combinedCmd, (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }
        let out = '';
        stream.on('close', (code, signal) => {
          conn.end();
          resolve(out);
        }).on('data', (data) => {
          out += data;
        }).stderr.on('data', (data) => {
          out += data;
        });
      });
    }).on('error', reject).connect(sshConfig);
  });
}

async function main() {
  const commands = [
    'echo "=== LS -LA ROOT ===" && ls -la /home/adminbackend/backone-production/',
    'echo "=== LS -LA .NEXT ===" && ls -la /home/adminbackend/backone-production/.next/ || echo "no .next"',
    'echo "=== LS -LA STANDALONE ===" && ls -la /home/adminbackend/backone-production/.next/standalone/ || echo "no standalone"'
  ];
  
  try {
    const output = await runSSHCommands(commands);
    console.log(output);
  } catch (err) {
    console.error("SSH Commands failed:", err.message);
  }
}

main();
