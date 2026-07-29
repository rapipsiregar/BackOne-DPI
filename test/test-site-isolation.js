// test/test-site-isolation.js
const axios = require('axios');
const assert = require('assert');

async function main() {
  console.log('=== Running Site Isolation Integration Test ===');
  
  console.log('1. Logging in as Nexus Tenant Admin...');
  const loginRes = await axios.post('https://demoplace.my.id/api/auth/login', {
    username: 'nexus',
    password: 'nexus'
  });
  
  const cookie = loginRes.headers['set-cookie'];
  const headers = { Cookie: cookie ? cookie.join('; ') : '' };
  
  console.log('2. Fetching /api/dashboard/agents/uptime...');
  const uptimeRes = await axios.get('https://demoplace.my.id/api/dashboard/agents/uptime?timeRange=1d', { headers });
  assert.ok(uptimeRes.data.ok, 'Uptime response must be ok');
  
  const uptimeKeys = Object.keys(uptimeRes.data.uptime);
  console.log('Uptime keys returned:', uptimeKeys);
  
  const siabAgentUuids = ['F6-2V-DT-8A', '2F-TF-1D-GK', 'YW-6I-61-LL', '8A-V3-PB-85', '1R-79-J9-YE'];
  const nexusAgentUuids = ['1T-5Q-RC-AS', '2N-ID-VQ-AL'];
  
  for (const uuid of uptimeKeys) {
    assert.ok(!siabAgentUuids.includes(uuid), `Security violation: SIAB agent ${uuid} leaked to Nexus admin!`);
  }
  console.log('✓ No SIAB agent uptimes leaked to Nexus.');

  console.log('3. Fetching /api/dashboard/agents/storage...');
  const storageRes = await axios.get('https://demoplace.my.id/api/dashboard/agents/storage', { headers });
  assert.ok(storageRes.data.ok, 'Storage response must be ok');
  
  const storageKeys = Object.keys(storageRes.data.storage);
  console.log('Storage keys returned:', storageKeys);
  
  for (const uuid of storageKeys) {
    assert.ok(!siabAgentUuids.includes(uuid), `Security violation: SIAB agent storage ${uuid} leaked to Nexus admin!`);
  }
  console.log('✓ No SIAB agent storage sizes leaked to Nexus.');

  console.log('=== SITE ISOLATION TEST PASSED SUCCESSFULY ===');
}

main().catch(err => {
  console.error('✗ TEST FAILED:', err.message);
  if (err.response) {
    console.error('Response data:', err.response.data);
  }
  process.exit(1);
});
