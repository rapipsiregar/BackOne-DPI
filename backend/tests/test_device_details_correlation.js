const { fetchDeviceDetails } = require('../netify');

async function runTest() {
  console.log('=== STARTING TDD TEST FOR DEVICE DETAIL PORT CORRELATION ===');

  const ip = '10.1.20.195';
  console.log(`\nFetching device details for ${ip}...`);
  const data = await fetchDeviceDetails(ip);

  if (!data || !Array.isArray(data.top_apps)) {
    throw new Error('Device details response must contain a top_apps array');
  }

  console.log(`- Retrieved ${data.top_apps.length} top apps/destinations`);

  let portApps = 0;
  let correlatedPortApps = 0;

  for (const app of data.top_apps) {
    if (app.type === 'port') {
      portApps++;
      console.log(`  - Found resolved port application:`);
      console.log(`    - Label:     ${app.label}`);
      console.log(`    - Sub-Label: ${app.sub_label}`);
      console.log(`    - Type:      ${app.type}`);
      
      // The label should be a friendly correlated name (e.g. MikroTik RouterBOARD), NOT Port YYYY
      if (app.label.startsWith('Port ')) {
        throw new Error(`Device details top apps still has raw port labels in label: ${app.label}`);
      }

      // The sub-label should contain the port number (e.g. Port YYYY)
      if (!app.sub_label || !app.sub_label.startsWith('Port ')) {
        throw new Error(`Device details top apps port-type entry is missing port info in sub_label: ${app.sub_label}`);
      }

      correlatedPortApps++;
    }
  }

  console.log(`\n- Total Port entries: ${portApps}`);
  console.log(`- Correlated Port entries: ${correlatedPortApps}`);

  if (portApps === 0) {
    throw new Error('Should have at least 1 port-type app entry in JRP client device profile');
  }

  console.log('✓ All assertions passed successfully!');
  console.log('\n=== ALL DEVICE DETAIL CORRELATION TESTS PASSED SUCCESSFULLY! ===');
}

runTest().catch(err => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
