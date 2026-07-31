// test/view_as_full_impersonation_test.js
// ─────────────────────────────────────────────────────────────────────────────
// TDD Test Suite: Full Target User Impersonation & View-As Audit Validation
// ─────────────────────────────────────────────────────────────────────────────

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Running TDD Test: Full Target User Impersonation & Audit Validation');

// 1. Check backend viewAs route accepts target_user_id and target_username
const viewAsRoutePath = path.resolve(__dirname, '../backend/routes/auth/viewAs.js');
const viewAsRouteContent = fs.readFileSync(viewAsRoutePath, 'utf8');
assert(
  viewAsRouteContent.includes('target_user_id') && viewAsRouteContent.includes('target_username'),
  'FAIL: backend/routes/auth/viewAs.js MUST accept target_user_id and target_username for full user impersonation'
);

// 2. Check auth middleware resolves target user document from MongoDB for full impersonation
const authMiddlewarePath = path.resolve(__dirname, '../backend/middleware/auth.js');
const authMiddlewareContent = fs.readFileSync(authMiddlewarePath, 'utf8');
assert(
  authMiddlewareContent.includes('targetUserId') && authMiddlewareContent.includes('_viewAsUser'),
  'FAIL: backend/middleware/auth.js MUST impersonate target user account attributes (role, site_uuid, agent_uuids)'
);

// 3. Check frontend admin-api passes target user metadata to view-as route
const adminApiPath = path.resolve(__dirname, '../src/lib/admin-api.ts');
const adminApiContent = fs.readFileSync(adminApiPath, 'utf8');
assert(
  adminApiContent.includes('targetUserId') || adminApiContent.includes('target_user_id'),
  'FAIL: src/lib/admin-api.ts MUST send target_user_id for user impersonation'
);

// 4. Check DashboardLayout renders target user name and role in View-As banner
const dashboardLayoutPath = path.resolve(__dirname, '../src/components/layout/DashboardLayout.tsx');
const dashboardLayoutContent = fs.readFileSync(dashboardLayoutPath, 'utf8');
assert(
  dashboardLayoutContent.includes('handleExit') && dashboardLayoutContent.includes('view_as_type'),
  'FAIL: DashboardLayout MUST render Exit View Mode button and target user details'
);

console.log('✅ ALL TDD IMPERSONATION TESTS PASSED SUCCESSFULLY!');
