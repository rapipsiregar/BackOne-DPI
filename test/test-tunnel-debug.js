const { Client } = require('ssh2');
const net = require('net');

const sshConfig = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 60000
};

const LOCAL_PORT = 27020;
const REMOTE_MONGO_HOST = 'mongodb.prod.proit.id';
const REMOTE_MONGO_PORT = 27017;

const conn = new Client();
const server = net.createServer((sock) => {
  console.log('Local client connected to tunnel.');
  conn.forwardOut(
    '127.0.0.1',
    sock.remotePort,
    REMOTE_MONGO_HOST,
    REMOTE_MONGO_PORT,
    (err, stream) => {
      if (err) {
        console.error('forwardOut error:', err.message);
        sock.destroy();
        return;
      }
      console.log('forwardOut stream opened successfully.');
      sock.pipe(stream);
      stream.pipe(sock);
    }
  );
});

conn.on('ready', () => {
  server.listen(LOCAL_PORT, '127.0.0.1', () => {
    console.log(`Tunnel listening on port ${LOCAL_PORT}`);
    
    // Connect a raw net socket to test it
    console.log('Connecting test client to local port...');
    const client = net.createConnection(LOCAL_PORT, '127.0.0.1', () => {
      console.log('Test client connected locally.');
      // Send a dummy byte to trigger forwarding
      client.write('hello');
    });
    
    client.on('data', (d) => {
      console.log('Received data from tunnel:', d.toString());
      client.destroy();
      server.close();
      conn.end();
    });
    
    client.on('error', (e) => {
      console.error('Test client error:', e.message);
      server.close();
      conn.end();
    });
    
    setTimeout(() => {
      console.log('Timeout reached, closing.');
      client.destroy();
      server.close();
      conn.end();
    }, 10000);
  });
}).on('error', (err) => {
  console.error('SSH Error:', err.message);
}).connect(sshConfig);
