const { MongoMemoryServer } = require('mongodb-memory-server');

async function start() {
  try {
    const mongod = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'backone_dpi'
      }
    });
    console.log('[MONGO] 🚀 Local In-Memory MongoDB running at: mongodb://127.0.0.1:27017/backone_dpi');

    const cleanup = async () => {
      await mongod.stop();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  } catch (err) {
    if (err.code === 'EADDRINUSE' || (err.message && err.message.includes('EADDRINUSE'))) {
      console.log('[MONGO] ℹ️ Port 27017 is already in use. Skipping in-memory MongoDB launch.');
    } else {
      console.error('[MONGO] ❌ Error starting MongoMemoryServer:', err.message);
    }
  }
}

start();
