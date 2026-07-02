const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../netify_data.db');
const dbModule = require('../database');

console.log("=== RUNNING TDD TEST: DEFAULT PASSWORDS VERIFICATION ===");

// 1. Verify admin password
const adminUser = dbModule.getUserByUsername('admin');
if (!adminUser) {
  throw new Error("❌ TEST FAILED: Admin user not found!");
}

const adminPwOk = bcrypt.compareSync('admin', adminUser.password_hash);
if (!adminPwOk) {
  throw new Error("❌ TEST FAILED: Admin default password is NOT 'admin'!");
}
console.log("✅ Admin default password is correctly 'admin'.");

// 2. Verify agent default password
const mockAgents = [
  { id: 999999999, uuid: "TDD-TEST-AGENT", label: "TDD-TEST-AGENT" }
];
dbModule.syncAgentUsers(mockAgents);

const agentUser = dbModule.getUserByUsername('tdd-test-agent');
if (!agentUser) {
  throw new Error("❌ TEST FAILED: Test agent user not created!");
}

const agentPwOk = bcrypt.compareSync('123', agentUser.password_hash);
if (!agentPwOk) {
  throw new Error("❌ TEST FAILED: Agent default password is NOT '123'!");
}
console.log("✅ Agent default password is correctly '123'.");

console.log("=== TDD TEST PASSED SUCCESSFULLY! ===");
process.exit(0);
