const db = require('../database');

function runTest() {
  console.log('=== STARTING TDD TEST FOR AGENT TRAFFIC SCALING ===');

  const agentUuid = '2F-TF-1D-GK';
  
  // 1. Retrieve true gateway bandwidth
  const stats = db.getStats(null, agentUuid);
  const trueDl = stats.latestBw?.total_download ?? 0;
  const trueUl = stats.latestBw?.total_upload ?? 0;
  
  console.log(`True Gateway Download: ${(trueDl / (1024*1024)).toFixed(2)} MB (${trueDl} bytes)`);
  console.log(`True Gateway Upload:   ${(trueUl / (1024*1024*1024)).toFixed(2)} GB (${trueUl} bytes)`);

  if (trueDl === 0 || trueUl === 0) {
    throw new Error('True download or upload bandwidth should not be zero');
  }

  // 2. Test getLatestBandwidthApps scaling
  console.log('\nRunning Test 1: Apps scaling...');
  const apps = db.getLatestBandwidthApps(100, null, agentUuid);
  if (!Array.isArray(apps)) {
    throw new Error('Apps should be an array');
  }
  console.log(`- Retrieved ${apps.length} applications`);
  
  let appDlSum = 0;
  let appUlSum = 0;
  for (const app of apps) {
    appDlSum += app.download;
    appUlSum += app.upload;
  }
  
  console.log(`- Sum of apps download: ${(appDlSum / (1024*1024)).toFixed(2)} MB (${appDlSum} bytes)`);
  console.log(`- Sum of apps upload:   ${(appUlSum / (1024*1024*1024)).toFixed(2)} GB (${appUlSum} bytes)`);

  // Assert sum matches gateway total (allowing small margin for rounding or empty labels)
  const dlAppDiffPct = Math.abs(appDlSum - trueDl) / trueDl * 100;
  const ulAppDiffPct = Math.abs(appUlSum - trueUl) / trueUl * 100;
  console.log(`- Apps download difference: ${dlAppDiffPct.toFixed(2)}%`);
  console.log(`- Apps upload difference:   ${ulAppDiffPct.toFixed(2)}%`);

  if (dlAppDiffPct > 5) {
    throw new Error(`Apps download sum mismatch: expected close to ${trueDl}, got ${appDlSum}`);
  }
  
  // Verify top app has non-zero download (not 0 MB!)
  const topApp = apps[0];
  console.log(`- Top Application: ${topApp.app_label} (Dl: ${(topApp.download / (1024*1024)).toFixed(2)} MB, Ul: ${(topApp.upload / (1024*1024)).toFixed(2)} MB)`);
  if (topApp.download < 1024 * 1024 * 5) { // Should be at least 5 MB
    throw new Error(`Top application download is too small (got ${(topApp.download / (1024*1024)).toFixed(2)} MB). Scaling failed.`);
  }
  console.log('✓ Apps scaling verified successfully!');

  // 3. Test getLatestDevices scaling
  console.log('\nRunning Test 2: Devices scaling...');
  const devices = db.getLatestDevices(1000, null, agentUuid);
  if (!Array.isArray(devices)) {
    throw new Error('Devices should be an array');
  }
  console.log(`- Retrieved ${devices.length} devices`);
  
  let devDlSum = 0;
  let devUlSum = 0;
  for (const dev of devices) {
    devDlSum += dev.download;
    devUlSum += dev.upload;
  }

  console.log(`- Sum of devices download: ${(devDlSum / (1024*1024)).toFixed(2)} MB (${devDlSum} bytes)`);
  console.log(`- Sum of devices upload:   ${(devUlSum / (1024*1024*1024)).toFixed(2)} GB (${devUlSum} bytes)`);

  // Assert sum matches gateway total exactly (limit is 1000, should cover all devices)
  const dlDevDiffPct = Math.abs(devDlSum - trueDl) / trueDl * 100;
  const ulDevDiffPct = Math.abs(devUlSum - trueUl) / trueUl * 100;
  console.log(`- Devices download difference: ${dlDevDiffPct.toFixed(2)}%`);
  console.log(`- Devices upload difference:   ${ulDevDiffPct.toFixed(2)}%`);

  if (dlDevDiffPct > 1) {
    throw new Error(`Devices download sum mismatch: expected close to ${trueDl}, got ${devDlSum}`);
  }

  const topDev = devices[0];
  console.log(`- Top Device: ${topDev.device_label} (Dl: ${(topDev.download / (1024*1024)).toFixed(2)} MB, Ul: ${(topDev.upload / (1024*1024)).toFixed(2)} MB)`);
  if (topDev.download < 1024 * 1024 * 5) { // Should be at least 5 MB
    throw new Error(`Top device download is too small (got ${(topDev.download / (1024*1024)).toFixed(2)} MB). Scaling failed.`);
  }
  console.log('✓ Devices scaling verified successfully!');

  console.log('\n=== ALL AGENT SCALING TESTS PASSED SUCCESSFULLY! ===');
}

try {
  runTest();
} catch (err) {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
}
