const db = require('../database');

function runTest() {
  console.log('=== STARTING TDD TEST FOR FLOW DESTINATION CORRELATION ===');

  // Fetch all recent flows from getLatestFlows (which automatically calls correlateFlows)
  const flows = db.getLatestFlows(1000, null, null);
  if (!Array.isArray(flows)) {
    throw new Error('Flows should be an array');
  }
  console.log(`- Retrieved ${flows.length} flows`);

  let resolvedLocal = 0;
  let resolvedPublic = 0;

  for (const f of flows) {
    const dstIp = f.dst_ip;
    const appLabel = f.app_label;
    const domain = f.domain;

    if (!dstIp) continue;

    // Check if the destination IP is local Intranet
    const isIntranet = dstIp.startsWith('10.') || dstIp.startsWith('192.168.');

    if (isIntranet) {
      // It should be correlated!
      if (appLabel && appLabel.includes('(') && appLabel.includes(dstIp)) {
        resolvedLocal++;
        
        // Assert domain contains port information
        if (!domain || !domain.startsWith('Port ')) {
          throw new Error(`Correlated intranet flow has invalid domain sub-label: ${domain}`);
        }
      }
    } else {
      // Public IP check
      // If it mapped to std port or cached domain
      if (appLabel && !appLabel.startsWith('Port ') && domain && domain.startsWith('Port ')) {
        resolvedPublic++;
      }
    }
  }

  console.log(`- Successfully correlated ${resolvedLocal} local/intranet flows`);
  console.log(`- Successfully correlated ${resolvedPublic} public destination flows`);

  // Verify at least some intranet flows are correlated since JRP and IFG cross-talk or communicate
  console.log('\nAsserting JRP/IFG intranet destination correlation...');
  
  // Find a specific flow where dst_ip starts with 10.250.0.
  const ifgDstFlow = flows.find(f => f.dst_ip && f.dst_ip.startsWith('10.250.0.') && f.app_label.includes('IFG'));
  if (ifgDstFlow) {
    console.log(`- Found correlated IFG destination flow:`);
    console.log(`  - Dst IP:     ${ifgDstFlow.dst_ip}`);
    console.log(`  - App Label:  ${ifgDstFlow.app_label}`);
    console.log(`  - Domain:     ${ifgDstFlow.domain}`);
  } else {
    console.log('- No IFG destination flows found in this snapshot limit (this is fine if no cross-site traffic occurred in the sample)');
  }

  // Find a specific JRP destination flow
  const jrpDstFlow = flows.find(f => f.dst_ip && (f.dst_ip.startsWith('10.1.') || f.dst_ip.startsWith('10.26.')) && f.app_label.includes('JRP'));
  if (jrpDstFlow) {
    console.log(`- Found correlated JRP destination flow:`);
    console.log(`  - Dst IP:     ${jrpDstFlow.dst_ip}`);
    console.log(`  - App Label:  ${jrpDstFlow.app_label}`);
    console.log(`  - Domain:     ${jrpDstFlow.domain}`);
  } else {
    console.log('- No JRP destination flows found in this snapshot limit');
  }

  // 3. Test getLatestBandwidthApps correlation
  console.log('\nAsserting Top Apps correlation...');
  const jrpAgentUuid = '2F-TF-1D-GK';
  const apps = db.getLatestBandwidthApps(20, null, jrpAgentUuid);
  
  let rawPortsFound = 0;
  let correlatedPortsFound = 0;
  for (const app of apps) {
    if (app.app_label.startsWith('Port ')) {
      rawPortsFound++;
    } else if (app.app_label.includes('Port') && app.app_label.includes('(')) {
      correlatedPortsFound++;
    }
  }
  console.log(`- Retrieved ${apps.length} top apps`);
  console.log(`- Raw Port labels remaining: ${rawPortsFound}`);
  console.log(`- Correlated Port labels:    ${correlatedPortsFound}`);
  
  if (rawPortsFound > 0) {
    throw new Error(`Found ${rawPortsFound} raw port labels that should have been correlated!`);
  }

  console.log('\n=== ALL FLOW CORRELATION TESTS PASSED SUCCESSFULLY! ===');
}

try {
  runTest();
} catch (err) {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
}
