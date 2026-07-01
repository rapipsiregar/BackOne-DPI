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

  // Verify specific historical device (e.g., 10.250.192.202) is present
  const historicalDevice = adminDevices.find(d => d.ip_address === '10.250.192.202');
  if (!historicalDevice) {
    throw new Error('Historical device 10.250.192.202 should be present in Admin view');
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

  // Test 2: Agent View (IFG LT.18)
  console.log('\nRunning Test 2: Agent View (8A-V3-PB-85)...');
  const agentUuid = '8A-V3-PB-85';
  const agentDevices = getLatestDevices(100, null, agentUuid);
  if (!Array.isArray(agentDevices)) {
    throw new Error('Agent devices should be an array');
  }
  console.log(`- Retrieved ${agentDevices.length} devices for Agent ${agentUuid}`);
  for (const d of agentDevices) {
    if (d.ip_address && !d.ip_address.startsWith('10.6.')) {
      throw new Error(`Non-agent device IP ${d.ip_address} found in Agent view`);
    }
  }
  console.log('- Verified all returned devices belong to the agent\'s subnet (10.6.x.x)');

  // Test 3: Agent View (CPI Balaraja / Office)
  console.log('\nRunning Test 3: Agent View (F6-2V-DT-8A)...');
  const agentUuidCPI = 'F6-2V-DT-8A';
  const devicesCPI = getLatestDevices(2000, null, agentUuidCPI);
  console.log(`- Retrieved ${devicesCPI.length} devices for Agent ${agentUuidCPI}`);
  for (const d of devicesCPI) {
    const isAllowedPrefix = d.ip_address.startsWith('10.250.') || 
                            d.ip_address.startsWith('192.168.') || 
                            d.ip_address.startsWith('10.121.');
    const isAllowedMac = [
      '2c:7b:a0:d8:86:91', '16:11:ac:73:34:1d', 'bc:45:5b:ca:d5:be',
      'de:ed:cc:57:58:34', 'f4:6d:3f:ef:01:a0', '60:be:b4:29:d3:36',
      '70:85:6c:81:50:d4', '70:85:6c:6d:f7:17', '60:be:b4:29:d3:33',
      '60:be:b4:26:4c:d6', '60:be:b4:29:d3:32'
    ].includes(d.mac_address);
    
    if (!isAllowedPrefix && !isAllowedMac) {
      throw new Error(`Non-agent device IP ${d.ip_address} / MAC ${d.mac_address} found in CPI Agent view`);
    }
  }
  console.log('- Verified all returned devices belong to CPI agent\'s subnets or MAC array');

  // Test 4: Agent View (JRP Cibubur / Kantor SIAB)
  console.log('\nRunning Test 4: Agent View (2F-TF-1D-GK)...');
  const agentUuidJRP = '2F-TF-1D-GK';
  const devicesJRP = getLatestDevices(2000, null, agentUuidJRP);
  console.log(`- Retrieved ${devicesJRP.length} devices for Agent ${agentUuidJRP}`);
  for (const d of devicesJRP) {
    const isAllowedPrefix = d.ip_address.startsWith('10.0.') || 
                            d.ip_address.startsWith('10.1.') || 
                            d.ip_address.startsWith('10.26.') ||
                            d.ip_address.startsWith('10.43.') ||
                            d.ip_address.startsWith('10.35.') ||
                            d.ip_address.startsWith('10.21.') ||
                            d.ip_address.startsWith('10.7.') ||
                            d.ip_address.startsWith('10.182.') ||
                            d.ip_address.startsWith('10.109.') ||
                            d.ip_address.startsWith('10.181.') ||
                            d.ip_address.startsWith('10.75.') ||
                            d.ip_address.startsWith('10.202.') ||
                            d.ip_address.startsWith('10.93.');
    const isAllowedMac = ['60:be:b4:1f:05:96'].includes(d.mac_address);
    
    if (!isAllowedPrefix && !isAllowedMac) {
      throw new Error(`Non-agent device IP ${d.ip_address} / MAC ${d.mac_address} found in JRP Agent view`);
    }
  }
  console.log('- Verified all returned devices belong to JRP agent\'s subnets or MAC array');

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
}

try {
  runTest();
} catch (error) {
  console.error('\n❌ TEST FAILED:', error.message);
  process.exit(1);
}
