const { fetchSecurityDevices } = require('../netify');

async function runTest() {
  console.log('=== STARTING TDD TEST FOR SECURITY DEVICES TENANT ISOLATION ===\n');

  // Test Case 1: JRP Cibubur Scope ('2F-TF-1D-GK')
  console.log('Running Test 1: Scoping JRP Cibubur (2F-TF-1D-GK)...');
  const jrpDevices = await fetchSecurityDevices(null, '2F-TF-1D-GK');
  console.log(`- Retrieved ${jrpDevices.length} security devices.`);

  for (const dev of jrpDevices) {
    const ip = dev.ip_address;
    
    // Assert that no IFG IP address (starts with 10.6.x.x) is leaked
    if (ip && ip.startsWith('10.6.')) {
      throw new Error(`DATA LEAK DETECTED: IFG device ${ip} leaked into JRP scope!`);
    }
    
    // Assert that the IP belongs to one of JRP subnets or is an authorized loopback/link-local
    const isJrpIp = ip.startsWith('10.1.') || ip.startsWith('10.0.') || ip.startsWith('10.26.') ||
                    ip.startsWith('10.43.') || ip.startsWith('10.35.') || ip.startsWith('10.21.') ||
                    ip.startsWith('10.7.') || ip.startsWith('10.182.') || ip.startsWith('10.109.') ||
                    ip.startsWith('10.181.') || ip.startsWith('10.75.') || ip.startsWith('10.202.') ||
                    ip.startsWith('10.93.') || ip.startsWith('fe80:') || ip.startsWith('10.102.');
    if (!isJrpIp) {
      throw new Error(`IP ${ip} does not match any JRP subnet range!`);
    }
  }
  console.log('✓ Test 1 Passed! No cross-tenant leakages for JRP.');

  // Test Case 2: IFG Scope ('8A-V3-PB-85')
  console.log('\nRunning Test 2: Scoping IFG (8A-V3-PB-85)...');
  const ifgDevices = await fetchSecurityDevices(null, '8A-V3-PB-85');
  console.log(`- Retrieved ${ifgDevices.length} security devices.`);

  for (const dev of ifgDevices) {
    const ip = dev.ip_address;
    
    // Assert that no JRP IP address is leaked
    const isJrpIp = ip.startsWith('10.1.') || ip.startsWith('10.0.') || ip.startsWith('10.26.') ||
                    ip.startsWith('10.43.') || ip.startsWith('10.35.') || ip.startsWith('10.21.') ||
                    ip.startsWith('10.7.') || ip.startsWith('10.182.') || ip.startsWith('10.109.') ||
                    ip.startsWith('10.181.') || ip.startsWith('10.75.') || ip.startsWith('10.202.') ||
                    ip.startsWith('10.93.') || ip.startsWith('10.102.');
    if (isJrpIp) {
      throw new Error(`DATA LEAK DETECTED: JRP device ${ip} leaked into IFG scope!`);
    }

    // Assert that the IP belongs to IFG subnets (10.6.x.x) or link-local
    const isIfgIp = ip.startsWith('10.6.') || ip.startsWith('fe80:');
    if (!isIfgIp) {
      throw new Error(`IP ${ip} does not match IFG subnet range!`);
    }
  }
  console.log('✓ Test 2 Passed! No cross-tenant leakages for IFG.');

  console.log('\n=== ALL SECURITY TENANT ISOLATION TESTS PASSED SUCCESSFULLY! ===');
}

runTest().catch(err => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
