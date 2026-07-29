// test/middleware_verification_test.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');

console.log('=== Running TDD Middleware Verification Test ===');

try {
  // 1. Verify src/middleware.ts exists
  const middlewarePath = path.join(ROOT, 'src', 'middleware.ts');
  const exists = fs.existsSync(middlewarePath);
  assert.ok(exists, 'src/middleware.ts must exist');
  console.log('✓ src/middleware.ts exists');

  // 2. Verify it exports 'middleware' function
  const content = fs.readFileSync(middlewarePath, 'utf8');
  assert.ok(content.includes('export function middleware'), 'src/middleware.ts must export function middleware');
  assert.ok(!content.includes('export function proxy'), 'src/middleware.ts must NOT export function proxy');
  console.log('✓ src/middleware.ts exports function middleware correctly');

  console.log('=== ALL TESTS PASSED ===');
  process.exit(0);
} catch (err) {
  console.error('✗ TEST FAILED:', err.message);
  process.exit(1);
}
