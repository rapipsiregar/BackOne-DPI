// test/view_as_cleanup_test.js
// ─────────────────────────────────────────────────────────────────────────────
// TDD Test Suite: View-As Mode Cleanup & Persistence Isolation
// ─────────────────────────────────────────────────────────────────────────────

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Running TDD Test: View-As Mode Cleanup & Persistence Isolation');

// 1. Verify Login Page clears view-as state
const loginPagePath = path.resolve(__dirname, '../src/app/login/page.tsx');
const loginPageContent = fs.readFileSync(loginPagePath, 'utf8');
assert(
  loginPageContent.includes("localStorage.removeItem('backone_view_as')") ||
  loginPageContent.includes('localStorage.removeItem("backone_view_as")'),
  'FAIL: Login page MUST clear localStorage backone_view_as on handleLogin'
);

// 2. Verify SidebarProfile Logout clears view-as state
const sidebarProfilePath = path.resolve(__dirname, '../src/components/layout/SidebarProfile.tsx');
const sidebarProfileContent = fs.readFileSync(sidebarProfilePath, 'utf8');
assert(
  sidebarProfileContent.includes("localStorage.removeItem('backone_view_as')") ||
  sidebarProfileContent.includes('localStorage.removeItem("backone_view_as")') ||
  sidebarProfileContent.includes('stopViewAs()'),
  'FAIL: SidebarProfile logout MUST clear localStorage backone_view_as'
);

// 3. Verify Inactivity Timeout Logout clears view-as state
const inactivityPath = path.resolve(__dirname, '../src/hooks/useInactivityTimeout.ts');
const inactivityContent = fs.readFileSync(inactivityPath, 'utf8');
assert(
  inactivityContent.includes("localStorage.removeItem('backone_view_as')") ||
  inactivityContent.includes('localStorage.removeItem("backone_view_as")') ||
  inactivityContent.includes('stopViewAs()'),
  'FAIL: Inactivity timeout logout MUST clear localStorage backone_view_as'
);

// 4. Verify Backend Logout clears view-as token cookie
const backendAuthPath = path.resolve(__dirname, '../backend/routes/auth/core.js');
const backendAuthContent = fs.readFileSync(backendAuthPath, 'utf8');
assert(
  backendAuthContent.includes('view_as_token') && backendAuthContent.includes('clearCookie'),
  'FAIL: Backend logout MUST clear view_as_token cookie'
);

// 5. Verify DashboardLayout / admin-api purges view-as state if logged in user is AGENT_VIEWER or not superadmin
const adminApiPath = path.resolve(__dirname, '../src/lib/admin-api.ts');
const adminApiContent = fs.readFileSync(adminApiPath, 'utf8');
assert(
  adminApiContent.includes('clearViewAsOnRoleMismatch') || adminApiContent.includes('validateViewAsSession'),
  'FAIL: admin-api MUST provide validation to purge stale view-as state on role mismatch'
);

console.log('✅ ALL TDD TESTS PASSED SUCCESSFULLY!');
