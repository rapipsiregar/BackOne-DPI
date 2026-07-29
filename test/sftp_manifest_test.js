// test/sftp_manifest_test.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');

console.log('=== Running TDD SFTP Manifest Verification Test ===');

try {
  const deployScriptPath = path.join(ROOT, 'scripts', 'deploy-sftp.js');
  const exists = fs.existsSync(deployScriptPath);
  assert.ok(exists, 'scripts/deploy-sftp.js must exist');
  
  const content = fs.readFileSync(deployScriptPath, 'utf8');
  
  // Verify .next/static is in the upload manifest
  assert.ok(
    content.includes("local: '.next/static'") || content.includes('local: ".next/static"'),
    'scripts/deploy-sftp.js must include local: \'.next/static\' in UPLOAD_MANIFEST'
  );
  
  console.log('✓ scripts/deploy-sftp.js includes .next/static in UPLOAD_MANIFEST');
  console.log('=== ALL TESTS PASSED ===');
  process.exit(0);
} catch (err) {
  console.error('✗ TEST FAILED:', err.message);
  process.exit(1);
}
