// backend/scripts/seed_device_labels.js
// ─────────────────────────────────────────────────────────────────────────────
// Batch Random Device Label Seeder
// Generates and assigns realistic custom device labels to all unlabelled MAC
// addresses in MongoDB without overwriting existing manual labels.
// ─────────────────────────────────────────────────────────────────────────────

const path = require('path');
const mongoose = require('mongoose');

// Load environment configuration
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
require('dotenv').config({ path: path.join(__dirname, '../../', envFile) });

const connectDB = require('../db/mongoose');
const { DeviceStat, Flow, CustomDeviceLabel } = require('../models/Schemas');

// Rich pool of People's Names (70% weight)
const PEOPLE_NAMES_POOL = [
  // Personal Owner Names & Laptops
  "Laptop Budi", "PC Andi", "Laptop Maya", "PC Danu", "Laptop Rizky",
  "iPhone Sarah", "iPad Doni", "Laptop Fajar", "MacBook Siti", "Laptop Eko",
  "ThinkPad Herman", "Dell Nina", "Laptop Dewi", "PC Agus", "Laptop Dimas",
  "PC Tri", "Laptop Nur", "iPhone Sari", "MacBook Bayu", "Laptop Hendra",
  "PC Rini", "Laptop Yulia", "Laptop Irfan", "PC Farhan", "Laptop Nabila",
  "PC Ari", "Laptop Kevin", "PC Clarissa", "Laptop Tari", "PC Wahyu",
  "Laptop Gilang", "PC Putu", "Laptop Made", "PC Wayan", "Laptop Rian",
  "PC Anton", "Laptop Bella", "PC Diana", "Laptop Erlangga", "PC Fitri",

  // Full Personal Names
  "Budi Prasetyo", "Andi Wijaya", "Maya Srikandi", "Danu Kusuma", "Rizky Pratama",
  "Sarah Amelia", "Doni Setiawan", "Fajar Ramadhan", "Siti Rahmawati", "Eko Susilo",
  "Herman Santoso", "Nina Kartika", "Dewi Anggraini", "Agus Kurniawan", "Dimas Saputra",
  "Tri Utami", "Nur Hidayah", "Bayu Perdana", "Hendra Gunawan", "Rini Astuti",
  "Yulia Lestari", "Irfan Maulana", "Farhan Hidayat", "Nabila Putri", "Ari Wibowo",
  "Kevin Sanjaya", "Clarissa Amanda", "Tari Wulandari", "Wahyu Hidayat", "Gilang Ramadhan",
  "Rian Ardianto", "Anton Sujarwo", "Bella Safitri", "Diana Novita", "Erlangga Putra"
];

// Secondary pool of Device/Department/Workstation Labels (30% weight)
const DEVICE_WORKSTATION_POOL = [
  "MacBook Pro - Sales", "ThinkPad - IT Support", "Dell Latitude - Finance",
  "Asus ROG - DevTeam", "HP EliteBook - Executive", "MacBook Air - Design",
  "Lenovo Legion - SOC Analyst", "Surface Pro - Operations", "Dell XPS - Management",
  "Acer Swift - Legal", "iPad Pro - Marketing", "Samsung Galaxy Tab - HR",
  "Workstation 01", "Workstation 02", "Meeting Room Display",
  "Guest Device - VIP", "Lobby Kiosk", "Printer Admin Floor 2",
  "Reception Desk PC", "Lab Test Server", "Security Camera Hub", "IoT Gateway"
];

function getRandomLabel() {
  // 70% probability for People's Names, 30% for Device/Workstation
  const isPerson = Math.random() < 0.7;
  if (isPerson) {
    const idx = Math.floor(Math.random() * PEOPLE_NAMES_POOL.length);
    return PEOPLE_NAMES_POOL[idx];
  } else {
    const idx = Math.floor(Math.random() * DEVICE_WORKSTATION_POOL.length);
    return DEVICE_WORKSTATION_POOL[idx];
  }
}

async function seedRandomDeviceLabels() {
  console.log("=== Starting Batch Random Device Label Seeder ===");
  
  try {
    await connectDB();

    // 1. Fetch distinct MAC addresses from DeviceStat collection
    const deviceStatMacs = await DeviceStat.distinct("mac_address", {
      mac_address: { $exists: true, $ne: null }
    });

    // 2. Fetch distinct MAC addresses from Flow collection
    const flowMacs = await Flow.distinct("src_mac", {
      src_mac: { $exists: true, $ne: null }
    });

    // 3. Merge and normalize MAC addresses
    const allMacs = new Set();
    [...deviceStatMacs, ...flowMacs].forEach(mac => {
      if (!mac) return;
      const cleanMac = String(mac).trim().toLowerCase();
      if (
        cleanMac &&
        cleanMac !== '-' &&
        cleanMac !== 'unknown' &&
        cleanMac !== '00:00:00:00:00:00'
      ) {
        allMacs.add(cleanMac);
      }
    });

    console.log(`[Info] Found ${allMacs.size} total unique MAC addresses across database.`);

    if (allMacs.size === 0) {
      console.log("[Info] No MAC addresses found. Exiting.");
      process.exit(0);
    }

    // 4. Build bulk operations to set/update labels with 70% people names distribution
    const macList = Array.from(allMacs);
    const bulkOps = macList.map(mac => ({
      updateOne: {
        filter: { mac_address: mac },
        update: { $set: { device_label: getRandomLabel() } },
        upsert: true
      }
    }));

    const bulkResult = await CustomDeviceLabel.bulkWrite(bulkOps);

    console.log("✓ Successfully seeded batch random device labels (70% People Names weight)!");
    console.log(`  - Total MACs Processed: ${macList.length}`);
    console.log(`  - Upserted: ${bulkResult.upsertedCount}`);
    console.log(`  - Modified: ${bulkResult.modifiedCount}`);

  } catch (err) {
    console.error("✗ Error seeding device labels:", err);
  } finally {
    await mongoose.connection.close();
    console.log("=== Seeding complete. Connection closed. ===");
    process.exit(0);
  }
}

seedRandomDeviceLabels();
