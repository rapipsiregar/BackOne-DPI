// cleanup_duplicate_agents.js
// One-time cleanup: remove agent data stored under the wrong site_uuid.
// SIAB agents (from current collector run) = definitive source of truth.
// Any SIAB agent found under NEXUS → delete from NEXUS.
// Any non-SIAB agent found under SIAB → delete from SIAB.

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../..', '.env.local') });

const SIAB_UUID   = '6681452d_9cae_4ff4_8ae8_0d504774265e';
const OFFICE_UUID = '1959bb55_045b_47c7_bbdd_f33b7db197b9';

// Definitive SIAB agent list (from most recent collector run)
const SIAB_AGENTS = ['F6-2V-DT-8A', 'YW-6I-61-LL', '2F-TF-1D-GK', '1R-79-J9-YE', '8A-V3-PB-85'];

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/backone_dpi');
  const db = mongoose.connection.db;

  const collections = (await db.listCollections().toArray())
    .map(c => c.name)
    .filter(n => !n.startsWith('system.'));

  let totalDeleted = 0;

  for (const colName of collections) {
    const col = db.collection(colName);

    // 1. Delete SIAB agents that are stored under OFFICE site_uuid
    const r1 = await col.deleteMany({
      site_uuid: OFFICE_UUID,
      agent_uuid: { $in: SIAB_AGENTS }
    });
    if (r1.deletedCount > 0) {
      console.log(`[${colName}] Removed ${r1.deletedCount} docs (SIAB agents from OFFICE)`);
      totalDeleted += r1.deletedCount;
    }

    // 2. Delete non-SIAB agents that are stored under SIAB site_uuid
    const r2 = await col.deleteMany({
      site_uuid: SIAB_UUID,
      agent_uuid: { $nin: [...SIAB_AGENTS, null] } // keep null = site-level summaries
    });
    if (r2.deletedCount > 0) {
      console.log(`[${colName}] Removed ${r2.deletedCount} docs (non-SIAB agents from SIAB)`);
      totalDeleted += r2.deletedCount;
    }
  }

  console.log(`\n✅ Cleanup complete. Total documents removed: ${totalDeleted}`);
  await mongoose.disconnect();
}

cleanup().catch(err => {
  console.error('❌ Cleanup failed:', err.message);
  process.exit(1);
});
