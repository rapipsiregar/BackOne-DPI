// test/check_remote_env.js
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
    'echo "=== FLUSH LOGS ===" && . ~/.nvm/nvm.sh && nvm use 20 && npx pm2 flush',
    'echo "=== HIT AGENTS ===" && curl -s https://demoplace.my.id/agents > /dev/null || echo "Hit failed"',
    'echo "=== LATEST FRONTEND ERR LOGS ===" && cat /home/adminbackend/.pm2/logs/backone-frontend-error.log'
  ];
  
  try {
    const output = await runSSHCommands(commands);
    console.log(output);
  } catch (err) {
    console.error("SSH Commands failed:", err.message);
  }
}

main();
