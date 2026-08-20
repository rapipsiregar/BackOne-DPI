// test/branding_unit_test.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=========================================');
console.log('  RUNNING TDD UNIT TEST FOR BRANDING LOGIC');
console.log('=========================================\n');

// 1. Read and transpile src/lib/branding.ts slightly to make it run in Node.js
const brandingCodePath = path.join(__dirname, '../src/lib/branding.ts');
let code = fs.readFileSync(brandingCodePath, 'utf8');

// Strip TypeScript interfaces, return types, parameter types, and export keywords
code = code.replace(/export\s+interface\s+\w+\s*\{[^}]*\}/g, '');
code = code.replace(/:\s*Branding\b/g, '');
code = code.replace(/selectedSiteUuid\?\s*:\s*string/g, 'selectedSiteUuid');
code = code.replace(/export\s+/g, '');

let testCount = 0;
let passedCount = 0;

function assert(label, condition) {
  testCount++;
  if (condition) {
    console.log(`  ✓ PASSED: ${label}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAILED: ${label}`);
  }
}

// Helper to run getSiteBranding with mocked environment
function runGetSiteBranding({ selectedSiteUuid, hostname, search, localStorageVal }) {
  const sandbox = {
    window: {
      location: {
        hostname: hostname || 'localhost',
        search: search || ''
      }
    },
    localStorage: {
      getItem: () => localStorageVal || null
    },
    console
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.getSiteBranding(selectedSiteUuid);
}

try {
  // Test Case 1: Default branding (no local storage, localhost)
  const brand1 = runGetSiteBranding({
    hostname: 'localhost'
  });
  assert('Default branding should be BackOne', brand1.name === 'BackOne' && brand1.logo === '/backone-logo.png');

  // Test Case 2: SIAB site UUID passed explicitly on demoplace.my.id
  const brand2 = runGetSiteBranding({
    selectedSiteUuid: '6681452d_9cae_4ff4_8ae8_0d504774265e',
    hostname: 'demoplace.my.id'
  });
  assert('SIAB site UUID on demoplace.my.id should return BackOne branding', brand2.name === 'BackOne' && brand2.logo === '/backone-logo.png');

  // Test Case 3: SIAB site UUID in localStorage on demoplace.my.id
  const brand3 = runGetSiteBranding({
    localStorageVal: '6681452d_9cae_4ff4_8ae8_0d504774265e',
    hostname: 'demoplace.my.id'
  });
  assert('SIAB site UUID in localStorage on demoplace.my.id should return BackOne branding', brand3.name === 'BackOne' && brand3.logo === '/backone-logo.png');

  // Test Case 4: Nexus site UUID passed explicitly
  const brand4 = runGetSiteBranding({
    selectedSiteUuid: 'd7902405_0dc2_458b_8584_ed4d24b64f24',
    hostname: 'localhost'
  });
  assert('Nexus site UUID should return Nexus branding', brand4.name === 'Nexus' && brand4.logo === '/nexus-logo.png');

  // Test Case 5: Default fallback on demoplace.my.id when no site is selected
  const brand5 = runGetSiteBranding({
    hostname: 'demoplace.my.id'
  });
  assert('Fallback on demoplace.my.id should be BackOne branding', brand5.name === 'BackOne' && brand5.logo === '/backone-logo.png');

  console.log(`\n=========================================`);
  console.log(`  RESULT: ${passedCount} / ${testCount} tests passed.`);
  console.log(`=========================================\n`);

  if (passedCount !== testCount) {
    process.exit(1);
  } else {
    process.exit(0);
  }
} catch (err) {
  console.error('Test execution failed with error:', err);
  process.exit(1);
}
