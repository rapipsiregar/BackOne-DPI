const net = require('net');
const { MongoMemoryServer } = require('mongodb-memory-server');

function checkPort(port, host) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function start() {
  try {
    const isLocalMongoRunning = await checkPort(27017, '127.0.0.1') || await checkPort(27017, 'localhost');
    if (isLocalMongoRunning) {
      console.log('[MONGO] ℹ️ Local persistent MongoDB is already running on port 27017. Skipping in-memory MongoDB launch.');
      // Keep process alive so concurrently doesn't show it as exited/failed
      setInterval(() => {}, 100000);
      return;
    }

    const mongod = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'backone_inspect_0'
      }
    });
    console.log('[MONGO] 🚀 Local In-Memory MongoDB running at: mongodb://127.0.0.1:27017/backone_inspect_0');

    const cleanup = async () => {
      await mongod.stop();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  } catch (err) {
    if (err.code === 'EADDRINUSE' || (err.message && err.message.includes('EADDRINUSE'))) {
      console.log('[MONGO] ℹ️ Port 27017 is already in use. Skipping in-memory MongoDB launch.');
      setInterval(() => {}, 100000);
    } else {
      console.error('[MONGO] ❌ Error starting MongoMemoryServer:', err.message);
    }
  }
}

start();
