
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = require('crypto');
}
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.production') });

const MONGODB_URI = process.env.MONGODB_URI;
const { collectAllAgents } = require('../proxy/collector');

async function run() {
  console.log('[Trigger] Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('[Trigger] Connected. Starting collection cycle...');
  try {
    const res = await collectAllAgents();
    console.log('[Trigger] Collection cycle finished successfully:', res);
  } catch (err) {
    console.error('[Trigger] Collection cycle failed:', err);
  } finally {
    await mongoose.connection.close();
    console.log('[Trigger] MongoDB connection closed.');
  }
}

run();
  
