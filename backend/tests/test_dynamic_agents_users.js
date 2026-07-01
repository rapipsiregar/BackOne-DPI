const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../netify_data.db');
const db = new Database(dbPath);

console.log("=== STARTING TDD TEST FOR DYNAMIC AGENTS & USERS ===");

// 1. Mock agents list returned from API
const mockAgents = [
  { id: 4897042839, uuid: "2F-TF-1D-GK", label: "2F-TF-1D-GK" },
  { id: 4895530456, uuid: "8A-V3-PB-85", label: "8A-V3-PB-85" },
  { id: 4894730147, uuid: "F6-2V-DT-8A", label: "F6-2V-DT-8A" },
  { id: 4895853843, uuid: "1R-79-J9-YE", label: "1R-79-J9-YE" } // New agent!
];

// 2. Call syncAgentUsers to dynamically seed users
const dbModule = require('../database');
console.log("- Running syncAgentUsers...");
dbModule.syncAgentUsers(mockAgents);

// 3. Verify users are created
const expectedUsernames = [
  '1r-79-j9-ye',
  '1R-79-J9-YE',
  'agent_cpi_balaraja_wan',
  '2f-tf-1d-gk',
  '2F-TF-1D-GK',
  'agent_jrp_cibubur'
];

for (const u of expectedUsernames) {
  const user = dbModule.getUserByUsername(u);
  if (!user) {
    throw new Error(`❌ TEST FAILED: User '${u}' was not created!`);
  }
  console.log(`✅ User verified: '${u}' (Role: ${user.role}, Agent UUID: ${user.agent_uuid})`);

  // Verify password matches agent123
  const pwOk = bcrypt.compareSync('agent123', user.password_hash);
  if (!pwOk) {
    throw new Error(`❌ TEST FAILED: Password for user '${u}' is incorrect!`);
  }
}

// 4. Verify data scoping/isolation for 1R-79-J9-YE
console.log("- Verifying data scoping/isolation for 1R-79-J9-YE...");
const agentUuid = '1R-79-J9-YE';

// A. Check flows count
const flows = dbModule.getLatestFlows(100, null, agentUuid);
console.log(`  Scoped flows count: ${flows.length}`);
for (const f of flows) {
  if (!['a2:cc:8e:7d:39:51', 'f2:69:9d:a1:5e:11', '8e:91:0f:6e:24:63'].includes(f.src_mac)) {
    throw new Error(`❌ TEST FAILED: Flow src_mac '${f.src_mac}' leaked into 1R-79-J9-YE scope!`);
  }
}

// B. Check devices count
const devices = dbModule.getLatestDevices(100, null, agentUuid);
console.log(`  Scoped devices count: ${devices.length}`);

// C. Check countries stats
const countries = dbModule.getLatestCountries(10, null, agentUuid);
console.log(`  Scoped countries count: ${countries.length}`);

console.log("=== ALL DYNAMIC AGENT AND USER TESTS PASSED! ===");
process.exit(0);
