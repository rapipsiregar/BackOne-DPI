// test_api.js - Tests the actual metadata-detail API endpoint
// Run: node proxy/test_api.js
const http = require('http');

function request(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method: 'GET',
    };
    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch (e) { resolve({ status: res.statusCode, raw: body }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  // Test 1: netbios_hostname for 10.6.10.44
  console.log('\n=== TEST 1: netbios_hostname=10.6.10.44 ===');
  try {
    const r1 = await request('/api/dashboard/metadata-detail?type=netbios_hostname&value=10.6.10.44');
    console.log('Status:', r1.status);
    if (r1.data) {
      console.log('Count:', r1.data.count);
      console.log('First 3 rows:', JSON.stringify(r1.data.data?.slice(0, 3), null, 2));
    } else {
      console.log('Raw:', r1.raw?.slice(0, 500));
    }
  } catch (e) {
    console.log('ERROR (maybe backend is on different port):', e.message);
  }

  // Test 2: Try port 3000 (Next.js API routes)
  console.log('\n=== TEST 2: via Next.js port 3000 ===');
  try {
    const r2 = await request('/api/dashboard/metadata-detail?type=netbios_hostname&value=10.6.10.44');
    const options2 = { hostname: 'localhost', port: 3000, path: '/api/dashboard/metadata-detail?type=netbios_hostname&value=10.6.10.44', method: 'GET' };
    const r3 = await new Promise((resolve, reject) => {
      const req = http.request(options2, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
          catch (e) { resolve({ status: res.statusCode, raw: body?.slice(0, 500) }); }
        });
      });
      req.on('error', reject);
      req.end();
    });
    console.log('Port 3000 - Status:', r3.status);
    if (r3.data) {
      console.log('Count:', r3.data.count);
      console.log('First 3 rows:', JSON.stringify(r3.data.data?.slice(0, 3), null, 2));
    } else {
      console.log('Raw:', r3.raw);
    }
  } catch (e) {
    console.log('Port 3000 ERROR:', e.message);
  }
}

main().catch(console.error);
