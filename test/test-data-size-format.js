// test/test-data-size-format.js
const assert = require('assert');

function formatDataSize(sizeMB) {
  let displaySize = "";
  if (sizeMB >= 1024 * 1024) {
    displaySize = `${(sizeMB / (1024 * 1024)).toFixed(2)} TB`;
  } else if (sizeMB >= 1024) {
    displaySize = `${(sizeMB / 1024).toFixed(2)} GB`;
  } else {
    displaySize = `${sizeMB.toFixed(2)} MB`;
  }
  return displaySize;
}

try {
  // Test case 1: Less than 1024 MB
  assert.strictEqual(formatDataSize(0.38), "0.38 MB");
  assert.strictEqual(formatDataSize(95.68), "95.68 MB");
  assert.strictEqual(formatDataSize(999.99), "999.99 MB");

  // Test case 2: Over 1024 MB (GB)
  assert.strictEqual(formatDataSize(1024), "1.00 GB");
  assert.strictEqual(formatDataSize(1536), "1.50 GB");
  assert.strictEqual(formatDataSize(7654.67), "7.48 GB");

  // Test case 3: Over 1024 * 1024 MB (TB)
  assert.strictEqual(formatDataSize(1048576), "1.00 TB");
  assert.strictEqual(formatDataSize(1572864), "1.50 TB");

  console.log("✓ All Data Size formatting unit tests passed successfully!");
} catch (err) {
  console.error("✗ Unit tests failed:", err.message);
  process.exit(1);
}
