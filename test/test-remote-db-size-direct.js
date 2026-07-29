const { Client } = require('ssh2');
const net = require('net');
const { MongoClient } = require('mongodb');

const sshConfig = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 60000
};

const LOCAL_PORT = 27019;
const REMOTE_MONGO_HOST = 'mongodb.prod.proit.id';
const REMOTE_MONGO_PORT = 27017;

const conn = new Client();
const server = net.createServer((sock) => {
  conn.forwardOut(
    '127.0.0.1',
    sock.remotePort,
    REMOTE_MONGO_HOST,
    REMOTE_MONGO_PORT,
    (err, stream) => {
      if (err) {
        sock.destroy();
        return;
      }
      sock.pipe(stream);
      stream.pipe(sock);
    }
  );
});

conn.on('ready', () => {
  server.listen(LOCAL_PORT, '127.0.0.1', async () => {
    console.log(`SSH Tunnel established on port ${LOCAL_PORT}`);
    try {
      const REMOTE_URI = `mongodb://backone_user:SusuKudaLiar@127.0.0.1:${LOCAL_PORT}/backone_dpi?authSource=backone_dpi&directConnection=true`;
      const client = new MongoClient(REMOTE_URI, { serverSelectionTimeoutMS: 5000 });
      await client.connect();
      const db = client.db('backone_dpi');
      console.log('Connected to remote database.');
      const collections = await db.listCollections().toArray();
      console.log('\nCollections and document counts:');
      for (const col of collections) {
        const count = await db.collection(col.name).countDocuments({});
        console.log(`- ${col.name}: ${count} documents`);
      }
      await client.close();
    } catch (e) {
      console.error('Error:', e.message);
    } finally {
      server.close();
      conn.end();
      console.log('Tunnel closed.');
    }
  });
}).on('error', (err) => {
  console.error('SSH Error:', err.message);
}).connect(sshConfig);
