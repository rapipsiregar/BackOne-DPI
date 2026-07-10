// test_metadata_detail.js - Test after restart
// Run: node proxy/test_metadata_detail.js
const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost', port: 3001, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    };
    const req = http.request(options, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(buf) }); }
        catch { resolve({ status: res.statusCode, raw: buf }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, cookie) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost', port: 3001, path, method: 'GET',
      headers: cookie ? { Cookie: cookie } : {},
    };
    const req = http.request(options, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(buf) }); }
        catch { resolve({ status: res.statusCode, raw: buf?.slice(0, 300) }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  // Step 1: Login to get cookie
  console.log('=== Step 1: Login ===');
  const login = await post('/api/auth/login', { username: 'admin', password: 'admin123' });
  console.log('Login status:', login.status);
  
  const setCookie = login.headers?.['set-cookie'];
  let cookie = '';
  if (setCookie) {
    cookie = setCookie.map(c => c.split(';')[0]).join('; ');
    console.log('Cookie obtained:', cookie.slice(0, 60) + '...');
  } else {
    console.log('No cookie received. Auth response:', JSON.stringify(login.data));
    // Try with a known admin credential
  }

  // Step 2: Test health
  console.log('\n=== Step 2: Health Check ===');
  const health = await get('/api/health', cookie);
  console.log('Health:', health.status, JSON.stringify(health.data));

  // Step 3: Test metadata-detail netbios_hostname
  console.log('\n=== Step 3: metadata-detail netbios_hostname=10.6.10.44 ===');
  const r = await get('/api/dashboard/metadata-detail?type=netbios_hostname&value=10.6.10.44', cookie);
  console.log('Status:', r.status);
  if (r.data) {
    console.log('Count (should be 1):', r.data.count);
    console.log('Data:', JSON.stringify(r.data.data, null, 2));
  } else {
    console.log('Raw:', r.raw);
  }

  // Step 4: Verify DB has 1 doc for 10.6.10.44
  console.log('\n=== Step 4: Direct DB verification ===');
  const mongoose = require('mongoose');
  const path = require('path');
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/backone');
  const db = mongoose.connection.db;
  const cnt = await db.collection('devicestats').countDocuments({ ip_address: '10.6.10.44' });
  console.log('DB count for 10.6.10.44:', cnt, '(expected: 1)');
  await mongoose.disconnect();
}

main().catch(console.error);
