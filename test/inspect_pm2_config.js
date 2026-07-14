// test/inspect_pm2_config.js
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
    conn.exec('find /home/adminbackend/backone-production -name "server.js"', (err, stream) => {
      if (err) throw err;
      let out = '';
      stream.on('close', () => {
        conn.end();
        console.log("Found server.js at:\n", out);
      }).on('data', (data) => {
        out += data;
      });
    });
  }).connect(sshConfig);
}

main();
