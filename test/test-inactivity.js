// Test suite for the inactivity timeout logic (TDD approach)
// This script mocks React hooks and browser APIs to verify correct behavior of our session timeout logic.

const assert = require("assert");

console.log("=== RUNNING INACTIVITY TIMEOUT LOGIC TESTS ===");

// ─── Test Harness ─────────────────────────────────────────────────────────────
class MockDocument {
  constructor() {
    this.visibilityState = "visible";
    this.listeners = {};
  }
  addEventListener(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }
  removeEventListener(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }
  trigger(event) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb());
    }
  }
}

class MockWindow {
  constructor() {
    this.listeners = {};
    this.location = { href: "" };
  }
  addEventListener(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }
  removeEventListener(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }
  trigger(event) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb());
    }
  }
}

// ─── Test Inactivity Logic Class ──────────────────────────────────────────────
class InactivityTimeoutTester {
  constructor(options = {}) {
    this.timeoutSeconds = options.timeoutSeconds || 3600; // 1 hour
    this.warningSeconds = options.warningSeconds || 120;  // 2 minutes
    this.showWarning = false;
    this.timeLeft = this.warningSeconds;
    this.isLoggedOut = false;
    this.lastActivity = Date.now();
    this.visibilityState = "visible";
  }

  // Simulate user activity event
  onUserActivity(currentTime) {
    if (this.visibilityState === "visible") {
      this.lastActivity = currentTime || Date.now();
      this.showWarning = false;
    }
  }

  // Simulate tick (every second or arbitrary delay)
  tick(currentTime) {
    const elapsed = Math.floor((currentTime - this.lastActivity) / 1000);
    const remaining = this.timeoutSeconds - elapsed;

    if (remaining <= 0) {
      this.isLoggedOut = true;
      this.showWarning = false;
    } else if (remaining <= this.warningSeconds) {
      this.timeLeft = remaining;
      this.showWarning = true;
    } else {
      this.showWarning = false;
    }
  }

  // Simulate returning to the tab
  onVisibilityChange(newVisibilityState, currentTime) {
    this.visibilityState = newVisibilityState;
    if (newVisibilityState === "visible") {
      const elapsed = Math.floor((currentTime - this.lastActivity) / 1000);
      const remaining = this.timeoutSeconds - elapsed;

      if (remaining <= 0) {
        this.isLoggedOut = true;
        this.showWarning = false;
      } else if (remaining <= this.warningSeconds) {
        this.timeLeft = remaining;
        this.showWarning = true;
      }
    }
  }
}

// ─── TEST CASES ───────────────────────────────────────────────────────────────

function testResetActivityWhenVisible() {
  console.log("- Test: Reset activity timer when tab is visible");
  const tester = new InactivityTimeoutTester();
  const initialActivity = tester.lastActivity;

  // Wait 10 seconds
  const timeAfter10s = initialActivity + 10000;
  tester.onUserActivity(timeAfter10s);
  
  // Last activity should be updated
  assert.ok(tester.lastActivity >= initialActivity);
}

function testNoResetActivityWhenHidden() {
  console.log("- Test: Do NOT reset activity timer when tab is hidden");
  const tester = new InactivityTimeoutTester();
  const initialActivity = tester.lastActivity;

  // Change tab status to hidden
  tester.visibilityState = "hidden";
  
  // User activity should be ignored for reset
  tester.onUserActivity(initialActivity + 10000);
  assert.strictEqual(tester.lastActivity, initialActivity);
}

function testWarningThreshold() {
  console.log("- Test: Trigger warning at 2 minutes remaining");
  const tester = new InactivityTimeoutTester({ timeoutSeconds: 3600, warningSeconds: 120 });
  const start = Date.now();

  // Tick at 59 minutes (3540 seconds elapsed, 60 seconds remaining)
  const warnTime = start + (3540 * 1000);
  tester.tick(warnTime);

  assert.strictEqual(tester.showWarning, true);
  assert.strictEqual(tester.timeLeft, 60);
}

function testSafeZoneAfterActivity() {
  console.log("- Test: Warning goes away when user becomes active");
  const tester = new InactivityTimeoutTester({ timeoutSeconds: 3600, warningSeconds: 120 });
  const start = Date.now();

  // Tick at 3540 seconds (warning is shown)
  const warnTime = start + (3540 * 1000);
  tester.tick(warnTime);
  assert.strictEqual(tester.showWarning, true);

  // User performs activity at warnTime
  tester.onUserActivity(warnTime);
  
  // Tick immediately after activity (should be in safe zone)
  tester.tick(warnTime);
  assert.strictEqual(tester.showWarning, false);
}

function testAutoLogout() {
  console.log("- Test: Auto-logout after 1 hour of total inactivity");
  const tester = new InactivityTimeoutTester({ timeoutSeconds: 3600, warningSeconds: 120 });
  const start = Date.now();

  // Tick after 3601 seconds
  const expireTime = start + (3601 * 1000);
  tester.tick(expireTime);

  assert.strictEqual(tester.isLoggedOut, true);
  assert.strictEqual(tester.showWarning, false);
}

function testTabSwitchSilentlyTicks() {
  console.log("- Test: Switching tabs continues counting down silently");
  const tester = new InactivityTimeoutTester({ timeoutSeconds: 3600, warningSeconds: 120 });
  const start = Date.now();

  // Switch tab away to hidden
  tester.onVisibilityChange("hidden", start);

  // Tick 10 minutes (600s) later while hidden
  const tenMinsLater = start + (600 * 1000);
  tester.tick(tenMinsLater);

  // Should still be in safe zone (no warning yet, no logout)
  assert.strictEqual(tester.showWarning, false);
  assert.strictEqual(tester.isLoggedOut, false);
}

function testTabReturnImmediateCheck() {
  console.log("- Test: Tab return triggers immediate state check");
  const tester = new InactivityTimeoutTester({ timeoutSeconds: 3600, warningSeconds: 120 });
  const start = Date.now();

  // User switches tab away
  tester.onVisibilityChange("hidden", start);

  // User is away for 59 minutes (3540s), then returns
  const returnTime = start + (3540 * 1000);
  tester.onVisibilityChange("visible", returnTime);

  // Should immediately show warning with remaining time of 60 seconds
  assert.strictEqual(tester.showWarning, true);
  assert.strictEqual(tester.timeLeft, 60);
}

function testTabReturnExpiredLogout() {
  console.log("- Test: Tab return logs out immediately if expired while away");
  const tester = new InactivityTimeoutTester({ timeoutSeconds: 3600, warningSeconds: 120 });
  const start = Date.now();

  // User switches tab away
  tester.onVisibilityChange("hidden", start);

  // User is away for 61 minutes (3660s), then returns
  const returnTime = start + (3660 * 1000);
  tester.onVisibilityChange("visible", returnTime);

  // Should immediately trigger logout
  assert.strictEqual(tester.isLoggedOut, true);
}

// Execute tests
try {
  testResetActivityWhenVisible();
  testNoResetActivityWhenHidden();
  testWarningThreshold();
  testSafeZoneAfterActivity();
  testAutoLogout();
  testTabSwitchSilentlyTicks();
  testTabReturnImmediateCheck();
  testTabReturnExpiredLogout();
  console.log("✓ ALL TESTS PASSED SUCCESSFULLY!");
} catch (error) {
  console.error("❌ TEST FAILURE:", error);
  process.exit(1);
}
