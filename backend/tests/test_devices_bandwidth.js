const { getLatestDevices } = require('../database');

function runTest() {
  console.log('=== STARTING TDD TEST FOR DEVICES BANDWIDTH ===');

  // Test 1: Admin View
  console.log('\nRunning Test 1: Admin View...');
  const adminDevices = getLatestDevices(100, null, null);
  if (!Array.isArray(adminDevices)) {
    throw new Error('Admin devices should be an array');
  }
  console.log(`- Retrieved ${adminDevices.length} devices for Admin`);
  
  // Verify descending sort
  for (let i = 1; i < adminDevices.length; i++) {
    if (adminDevices[i].download > adminDevices[i-1].download) {
      throw new Error(`Admin devices not sorted correctly at index ${i}: ${adminDevices[i].download} > ${adminDevices[i-1].download}`);
    }
  }
  console.log('- Verified sort order is descending');

  // Find any active reconstructed flow client (which has null id because it is not in the devices table)
  const activeReconstructed = adminDevices.find(d => d.id === null && d.download > 0 && d.ip_address.startsWith('10.6.'));
  if (!activeReconstructed) {
    throw new Error('Should find at least one active reconstructed flow client (IP starting with 10.6. and id = null) in Admin view');
  }
  console.log(`- Active reconstructed device ${activeReconstructed.ip_address} has download: ${activeReconstructed.download} bytes (OK)`);

  // Verify specific historical device (e.g., 10.250.192.202) has non-zero fallback bandwidth
  const historicalDevice = adminDevices.find(d => d.ip_address === '10.250.192.202');
  if (!historicalDevice) {
    throw new Error('Historical device 10.250.192.202 should be present in Admin view');
  }
  if (historicalDevice.download === 0) {
    throw new Error(`Historical device 10.250.192.202 should have non-zero fallback download, got ${historicalDevice.download}`);
  }
  console.log(`- Historical device 10.250.192.202 has download: ${historicalDevice.download} bytes (OK)`);

  // Verify no duplicate IP addresses
  const seenIps = new Set();
  for (const d of adminDevices) {
    if (seenIps.has(d.ip_address)) {
      throw new Error(`Duplicate IP address found: ${d.ip_address}`);
    }
    seenIps.add(d.ip_address);
  }
  console.log('- Verified no duplicate IP addresses exist in the output');

  // Test 2: Agent View
  console.log('\nRunning Test 2: Agent View...');
  const agentUuid = '8A-V3-PB-85'; // IFG LT.18
  const agentDevices = getLatestDevices(100, null, agentUuid);
  if (!Array.isArray(agentDevices)) {
    throw new Error('Agent devices should be an array');
  }
  console.log(`- Retrieved ${agentDevices.length} devices for Agent ${agentUuid}`);

  // Verify only agent devices are returned (IP starts with 10.6.)
  for (const d of agentDevices) {
    if (d.ip_address && !d.ip_address.startsWith('10.6.')) {
      throw new Error(`Non-agent device IP ${d.ip_address} found in Agent view`);
    }
  }
  console.log('- Verified all returned devices belong to the agent\'s subnet (10.6.x.x)');

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
}

try {
  runTest();
} catch (error) {
  console.error('\n❌ TEST FAILED:', error.message);
  process.exit(1);
}
