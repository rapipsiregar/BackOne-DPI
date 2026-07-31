const http = require('http');

function testUrl(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    console.log(`[TEST] Fetching ${url}...`);
    const req = http.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const duration = Date.now() - start;
        console.log(`[TEST] ${url} -> Status: ${res.statusCode}, Time: ${duration}ms, Bytes: ${data.length}`);
        resolve({ url, status: res.statusCode, duration, bytes: data.length });
      });
    });
    req.on('error', (err) => {
      const duration = Date.now() - start;
      console.log(`[TEST] ${url} -> ERROR: ${err.message}, Time: ${duration}ms`);
      resolve({ url, error: err.message, duration });
    });
    req.on('timeout', () => {
      req.destroy();
      const duration = Date.now() - start;
      console.log(`[TEST] ${url} -> TIMEOUT after ${duration}ms`);
      resolve({ url, timeout: true, duration });
    });
  });
}

async function run() {
  console.log('=== STARTING DASHBOARD ROUTE SPEED TEST ===');
  await testUrl('http://127.0.0.1:3001/api/dashboard/devices');
  await testUrl('http://127.0.0.1:3001/api/dashboard/summary');
  console.log('=== TEST COMPLETE ===');
}

run();
