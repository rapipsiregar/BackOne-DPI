// test/check_pm2_restarts.js
const { Client } = require('ssh2');

const sshConfig = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH'
};

async function main() {
  const conn = new Client();
  conn.on('ready', () => {
    conn.exec('. ~/.nvm/nvm.sh && nvm use 20 && npx pm2 list', (err, stream) => {
      if (err) throw err;
      let out = '';
      stream.on('close', () => {
        conn.end();
        console.log(out);
      }).on('data', (data) => {
        out += data;
      });
    });
  }).connect(sshConfig);
}

main();
