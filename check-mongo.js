// check-mongo.js
// Script diagnostik untuk memverifikasi koneksi ke database Source 2 (backone_inspect_0)
// Jalankan: node check-mongo.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('[ERROR] MONGODB_URI tidak ditemukan di .env.local');
  process.exit(1);
}

console.log('\n╔════════════════════════════════════════════════╗');
console.log('║    Source 2 — MongoDB Connection Diagnostic   ║');
console.log('╚════════════════════════════════════════════════╝\n');
console.log(`[Check] Mencoba koneksi ke: ${MONGODB_URI}\n`);

async function checkMongo() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });

    const db = mongoose.connection.db;
    const dbName = db.databaseName;

    console.log(`[OK] Berhasil terhubung ke MongoDB!`);
    console.log(`[OK] Database: ${dbName}`);

    // Daftar koleksi yang ada
    const collections = await db.listCollections().toArray();
    if (collections.length === 0) {
      console.log('[INFO] Database masih kosong — belum ada koleksi.');
    } else {
      console.log(`[INFO] Koleksi yang ada (${collections.length}):`);
      for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`       - ${col.name}: ${count} dokumen`);
      }
    }

    console.log('\n[RESULT] ✅ STEP 8 PASS — Koneksi ke database Source 2 berhasil.\n');
    process.exit(0);
  } catch (err) {
    console.error(`[ERROR] Gagal terhubung ke MongoDB: ${err.message}`);
    console.error('\nPossible causes:');
    console.error('  1. Host MongoDB tidak bisa dijangkau (butuh VPN/SSH tunnel)');
    console.error('  2. Kredensial backone_inspect:backone_inspect salah');
    console.error('  3. MongoDB belum berjalan di server tujuan');
    console.error('\n[RESULT] ❌ STEP 8 FAIL — Hubungi atasan untuk verifikasi koneksi.\n');
    process.exit(1);
  }
}

checkMongo();
