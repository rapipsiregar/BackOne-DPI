// test/multipart_proxy_test.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');

console.log('=========================================');
console.log('  RUNNING TDD TESTS FOR MULTIPART PROXIES');
console.log('=========================================\n');

let testCount = 0;
let passedCount = 0;

function runAssert(label, condition) {
  testCount++;
  if (condition) {
    console.log(`  ✓ PASSED: ${label}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAILED: ${label}`);
  }
}

try {
  // Test Case 1: Cek keberadaan file src/app/api/auth/admin/create-external-user/route.ts
  const createRoutePath = path.join(ROOT, 'src', 'app', 'api', 'auth', 'admin', 'create-external-user', 'route.ts');
  const createExists = fs.existsSync(createRoutePath);
  runAssert('create-external-user/route.ts should exist', createExists);

  if (createExists) {
    const content = fs.readFileSync(createRoutePath, 'utf8');
    runAssert('create-external-user/route.ts should export POST handler', content.includes('export async function POST'));
    runAssert('create-external-user/route.ts should read req.json(), req.body or req.formData()', content.includes('req.json()') || content.includes('req.body') || content.includes('req.formData()'));
    runAssert('create-external-user/route.ts should forward auth cookie', content.includes('Cookie') || content.includes('cookie'));
    runAssert('create-external-user/route.ts should use NEXT_PUBLIC_API_URL or port 3011', content.includes('NEXT_PUBLIC_API_URL') || content.includes('3011'));
  }

  // Test Case 2: Cek keberadaan file src/app/api/auth/admin/update-agent-user/route.ts
  const updateRoutePath = path.join(ROOT, 'src', 'app', 'api', 'auth', 'admin', 'update-agent-user', 'route.ts');
  const updateExists = fs.existsSync(updateRoutePath);
  runAssert('update-agent-user/route.ts should exist', updateExists);

  if (updateExists) {
    const content = fs.readFileSync(updateRoutePath, 'utf8');
    runAssert('update-agent-user/route.ts should export POST handler', content.includes('export async function POST'));
    runAssert('update-agent-user/route.ts should read req.json(), req.body or req.formData()', content.includes('req.json()') || content.includes('req.body') || content.includes('req.formData()'));
    runAssert('update-agent-user/route.ts should forward auth cookie', content.includes('Cookie') || content.includes('cookie'));
    runAssert('update-agent-user/route.ts should use NEXT_PUBLIC_API_URL or port 3011', content.includes('NEXT_PUBLIC_API_URL') || content.includes('3011'));
  }

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
