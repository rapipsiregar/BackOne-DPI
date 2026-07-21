const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const assert = require('assert');
const netify = require('../proxy/netifyClient');

async function testAll() {
  console.log('Starting TDD API Migration Tests against Netify API...');
  
  // Test 1: fetchAgents
  console.log('\n--- Test 1: fetchAgents ---');
  const agents = await netify.fetchAgents('6681452d_9cae_4ff4_8ae8_0d504774265e');
  console.log('Agents returned count:', agents?.length);
  assert(Array.isArray(agents), 'Agents must be an array');
  assert(agents.length > 0, 'Should find at least 1 agent');
  assert(agents[0].uuid, 'Agent must have a uuid');
  assert(agents[0].label, 'Agent must have a label');
  
  // Test 2: fetchBandwidthSummary
  console.log('\n--- Test 2: fetchBandwidthSummary ---');
  const summary = await netify.fetchBandwidthSummary(1440, 'F6-2V-DT-8A', '6681452d_9cae_4ff4_8ae8_0d504774265e');
  console.log('Bandwidth summary returned:', summary);
  assert(summary, 'Summary should not be null');
  assert(typeof summary.bandwidth_down === 'number', 'bandwidth_down must be a number');
  assert(typeof summary.bandwidth_up === 'number', 'bandwidth_up must be a number');
  
  // Test 3: fetchTopApps
  console.log('\n--- Test 3: fetchTopApps ---');
  const apps = await netify.fetchTopApps(1440, 10, 'F6-2V-DT-8A', '6681452d_9cae_4ff4_8ae8_0d504774265e');
  console.log('Top Apps returned count:', apps?.length);
  if (apps && apps.length > 0) {
    console.log('First App:', apps[0]);
    assert(apps[0].application?.label, 'App must have application.label');
    assert(typeof apps[0].download === 'number', 'download must be a number');
    assert(typeof apps[0].upload === 'number', 'upload must be a number');
    assert(typeof apps[0].flows === 'number', 'flows must be a number');
  }
  
  // Test 4: fetchDiscoveredDevices
  console.log('\n--- Test 4: fetchDiscoveredDevices ---');
  const devices = await netify.fetchDiscoveredDevices(120, 10, 'F6-2V-DT-8A', '6681452d_9cae_4ff4_8ae8_0d504774265e');
  console.log('Discovered devices count:', devices?.length);
  if (devices && devices.length > 0) {
    console.log('First Device:', devices[0]);
    assert(devices[0].ip_address, 'Device must have ip_address');
  }
  
  // Test 5: fetchFlows
  console.log('\n--- Test 5: fetchFlows ---');
  const flows = await netify.fetchFlows(10, 'F6-2V-DT-8A', '6681452d_9cae_4ff4_8ae8_0d504774265e');
  console.log('Flows count:', flows?.length);
  if (flows && flows.length > 0) {
    console.log('First Flow:', flows[0]);
    assert(flows[0].flow_id, 'Flow must have flow_id');
    assert(flows[0].src_ip, 'Flow must have src_ip');
    assert(flows[0].download >= 0, 'download must be >= 0');
    assert(flows[0].upload >= 0, 'upload must be >= 0');
    assert(flows[0].first_seen, 'first_seen must exist');
  }
  
  console.log('\n✓ All TDD API Migration Tests PASSED!');
}

testAll().catch(err => {
  console.error('\n✗ Test failed:', err);
  process.exit(1);
});
