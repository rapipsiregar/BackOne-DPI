const mongoose = require('../backend/node_modules/mongoose');
const dotenv = require('../backend/node_modules/dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/backone_dpi';

async function main() {
  try {
    console.log(`Connecting to: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Connected! Deleting superadmin external accounts...');

    const db = mongoose.connection.db;
    const usernamesToDelete = ['super_analyst', 'super_engineer', 'sulist', 'suner'];

    const res = await db.collection('users').deleteMany({
      username: { $in: usernamesToDelete }
    });

    console.log(`Deleted ${res.deletedCount} users:`, usernamesToDelete);
    await mongoose.disconnect();
    console.log('Done!');
  } catch (err) {
    console.error('Error deleting users:', err);
    process.exit(1);
  }
}

main();
