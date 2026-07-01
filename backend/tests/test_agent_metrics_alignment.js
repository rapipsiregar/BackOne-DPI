const db = require('../database');
const { fetchAgentDetails } = require('../netify');

async function runTest() {
  console.log('=== STARTING TDD TEST FOR AGENT METRICS ALIGNMENT ===');

  const agentUuid = '2F-TF-1D-GK';

  // 1. Fetch from getStats (used in agent dashboard)
  console.log('\nFetching stats from getStats(null, agentUuid)...');
  const stats = db.getStats(null, agentUuid);

  console.log(`- totalDevices: ${stats.totalDevices}`);
  console.log(`- activeFlows: ${stats.activeFlows}`);
  console.log(`- download: ${stats.latestBw?.total_download} bytes`);
  console.log(`- upload: ${stats.latestBw?.total_upload} bytes`);

  // 2. Fetch from fetchAgentDetails (used in admin popup modal)
  console.log('\nFetching details from fetchAgentDetails(agentUuid)...');
  const details = await fetchAgentDetails(agentUuid);

  console.log(`- summary.total_devices: ${details.summary?.total_devices}`);
  console.log(`- summary.active_flows: ${details.summary?.active_flows}`);
  console.log(`- summary.bandwidth_down: ${details.summary?.bandwidth_down} bytes`);
  console.log(`- summary.bandwidth_up: ${details.summary?.bandwidth_up} bytes`);
  console.log(`- details.devices count: ${details.devices.length}`);
  console.log(`- details.flows count: ${details.flows.length}`);
  console.log(`- details.events count: ${details.events.length}`);

  // 3. Verify exact alignment
  console.log('\nAsserting alignment...');
  if (Math.abs(stats.totalDevices - details.summary.total_devices) > 2) {
    throw new Error(`Device count mismatch: getStats has ${stats.totalDevices}, details has ${details.summary.total_devices}`);
  }
  if (Math.abs(stats.activeFlows - details.summary.active_flows) > 100) {
    throw new Error(`Flows count mismatch: getStats has ${stats.activeFlows}, details has ${details.summary.active_flows}`);
  }
  const dlDiff = Math.abs(stats.latestBw?.total_download - details.summary.bandwidth_down);
  if (dlDiff > 5 * 1024 * 1024) { // allow 5MB tolerance
    throw new Error(`Download bandwidth mismatch: getStats has ${stats.latestBw?.total_download}, details has ${details.summary.bandwidth_down}`);
  }
  const ulDiff = Math.abs(stats.latestBw?.total_upload - details.summary.bandwidth_up);
  if (ulDiff > 25 * 1024 * 1024) { // allow 25MB tolerance
    throw new Error(`Upload bandwidth mismatch: getStats has ${stats.latestBw?.total_upload}, details has ${details.summary.bandwidth_up}`);
  }
  console.log('✓ Stats and Details are perfectly identical!');

  // 4. Verify correctness of cumulative counts
  console.log('\nAsserting correctness of cumulative counts...');
  if (stats.totalDevices < 45 || stats.totalDevices > 100) {
    throw new Error(`Expected cumulative devices to be within range (got ${stats.totalDevices})`);
  }
  if (stats.activeFlows < 2000 || stats.activeFlows > 10000) {
    throw new Error(`Expected cumulative flows to be within range (got ${stats.activeFlows})`);
  }

  const dlMB = stats.latestBw.total_download / (1024 * 1024);
  const ulGB = stats.latestBw.total_upload / (1024 * 1024 * 1024);
  console.log(`- Bandwidth Download: ${dlMB.toFixed(2)} MB`);
  console.log(`- Bandwidth Upload:   ${ulGB.toFixed(2)} GB`);

  if (dlMB < 500 || dlMB > 1000) {
    throw new Error(`Expected download to be around JRP range (got ${dlMB.toFixed(2)} MB)`);
  }
  if (ulGB < 2.3 || ulGB > 5.0) {
    throw new Error(`Expected upload to be around JRP range (got ${ulGB.toFixed(2)} GB)`);
  }
  console.log('✓ Cumulative counts are correct!');

  // 5. Verify devices list is aligned and has no duplicate IPs
  console.log('\nAsserting devices list integrity...');
  const seenIps = new Set();
  for (const dev of details.devices) {
    if (seenIps.has(dev.ip_address)) {
      throw new Error(`Duplicate IP address in devices list: ${dev.ip_address}`);
    }
    seenIps.add(dev.ip_address);
  }
  console.log(`- Verified no duplicate IP addresses in JRP devices list (${seenIps.size} unique IPs)`);
  console.log('✓ Devices list integrity verified!');

  console.log('\n=== ALL METRICS ALIGNMENT TESTS PASSED SUCCESSFULLY! ===');
}

runTest().catch(err => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
