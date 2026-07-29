const { Client } = require('ssh2');

const SSH = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 60000
};

const remoteJs = `
const net = require('net');
const s = net.createConnection(27017, 'mongodb.prod.proit.id', () => {
  console.log('SUCCESS: Connected to mongodb.prod.proit.id from remote server!');
  s.destroy();
}).on('error', e => {
  console.error('FAILED: ' + e.message);
});
`;

const conn = new Client();
conn.on('ready', () => {
  const b64 = Buffer.from(remoteJs).toString('base64');
  conn.exec(`echo "${b64}" | base64 -d | node`, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log('Result from remote:');
      console.log(out.trim());
      conn.end();
    });
  });
}).on('error', console.error).connect(SSH);
