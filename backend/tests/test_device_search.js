const db = require('../database');

function runTest() {
  console.log('=== STARTING TDD TEST FOR HISTORICAL DEVICE SEARCH ===');

  // Test 1: Search for specific IP in JRP Cibubur (Admin view)
  console.log('\nRunning Test 1: Admin searching JRP IP...');
  const searchIp = '10.1.20.195';
  const devicesJRP = db.getLatestDevices(100, null, null, searchIp);
  if (!Array.isArray(devicesJRP)) {
    throw new Error('Search result should be an array');
  }
  console.log(`- Found ${devicesJRP.length} devices matching "${searchIp}"`);
  
  if (devicesJRP.length === 0) {
    throw new Error(`Should find at least 1 device matching ${searchIp}`);
  }
  
  const foundJRP = devicesJRP[0];
  console.log(`- Device found: ${foundJRP.ip_address} | MAC: ${foundJRP.mac_address} | Label: ${foundJRP.device_label}`);
  if (foundJRP.ip_address !== searchIp) {
    throw new Error(`Expected IP address ${searchIp}, got ${foundJRP.ip_address}`);
  }
  console.log('✓ Test 1 Passed!');

  // Test 2: Search for subnet (e.g. 10.6.) in Admin View
  console.log('\nRunning Test 2: Admin searching subnet "10.6."...');
  const devicesSubnet = db.getLatestDevices(100, null, null, '10.6.');
  console.log(`- Found ${devicesSubnet.length} devices matching subnet "10.6."`);
  for (const dev of devicesSubnet) {
    if (!dev.ip_address.startsWith('10.6.')) {
      throw new Error(`Device IP ${dev.ip_address} does not start with "10.6."`);
    }
  }
  console.log('✓ Test 2 Passed!');

  // Test 3: Search for specific IP in Agent View (Scoped to CPI)
  console.log('\nRunning Test 3: Agent CPI searching own IP...');
  const agentUuidCPI = 'F6-2V-DT-8A';
  const searchCPIIp = '10.250.192.202';
  const devicesCPI = db.getLatestDevices(100, null, agentUuidCPI, searchCPIIp);
  console.log(`- Found ${devicesCPI.length} devices for CPI matching "${searchCPIIp}"`);
  if (devicesCPI.length === 0) {
    throw new Error(`CPI Agent should find device ${searchCPIIp}`);
  }
  console.log(`- Device: ${devicesCPI[0].ip_address} | Label: ${devicesCPI[0].device_label}`);
  console.log('✓ Test 3 Passed!');

  // Test 4: Search for non-existent IP
  console.log('\nRunning Test 4: Searching non-existent IP...');
  const emptyResult = db.getLatestDevices(100, null, null, '99.99.99.99');
  console.log(`- Found ${emptyResult.length} devices matching "99.99.99.99"`);
  if (emptyResult.length !== 0) {
    throw new Error('Result should be empty for non-existent IP');
  }
  console.log('✓ Test 4 Passed!');

  console.log('\n=== ALL HISTORICAL DEVICE SEARCH TESTS PASSED SUCCESSFULLY! ===');
}

try {
  runTest();
} catch (err) {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
}
