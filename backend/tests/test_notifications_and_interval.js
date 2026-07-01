const assert = require('assert');
const Database = require('better-sqlite3');
const path = require('path');
const dbModule = require('../database');

console.log("=== STARTING TDD TEST FOR NOTIFICATIONS & INTERVALS ===");

// 1. Test Data Interval Function
try {
  const interval = dbModule.getDataInterval();
  console.log("Data Interval retrieved:", interval);
  assert.ok(interval.start, "Start timestamp must exist");
  assert.ok(interval.end, "End timestamp must exist");
  assert.ok(new Date(interval.start).getTime() <= new Date(interval.end).getTime(), "Start timestamp must be <= End timestamp");
  console.log("✓ Test 1 Passed: getDataInterval returns correct timestamp range");
} catch (e) {
  console.error("Test 1 Failed:", e.message);
  process.exit(1);
}

// 2. Test Events & Threats Availability
try {
  const events = dbModule.getLatestEvents(10);
  const threats = dbModule.getLatestThreats(10);
  console.log(`Latest events count: ${events.length}, latest threats count: ${threats.length}`);
  assert.ok(Array.isArray(events), "Events must be an array");
  assert.ok(Array.isArray(threats), "Threats must be an array");
  console.log("✓ Test 2 Passed: getLatestEvents and getLatestThreats return arrays");
} catch (e) {
  console.error("Test 2 Failed:", e.message);
  process.exit(1);
}

console.log("=== ALL TESTS PASSED SUCCESSFULLY! ===");
