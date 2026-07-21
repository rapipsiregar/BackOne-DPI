// test/analyze_inter_agent_flows.js — diagnostic script
// Checks if there are real inter-agent flows in MongoDB

const mongoose = require('../backend/node_modules/mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/backone_dpi';
const { DeviceStat, Flow } = require('../backend/models/Schemas');
const { CustomAgentLocation } = require('../backend/models/SchemasAux');

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('\n✓ Connected to MongoDB\n');

  const SIAB_SITE = '6681452d_9cae_4ff4_8ae8_0d504774265e';

  // 1. List registered agent coordinates
  const locations = await CustomAgentLocation.find({ site_uuid: SIAB_SITE }).lean();
  const agentUuids = locations.map(l => l.agent_uuid);
  console.log(`=== Agent Locations Registered (${locations.length}) ===`);
  for (const loc of locations) {
    console.log(`  • ${loc.agent_uuid} → ${loc.label || '(no label)'} [${loc.latitude}, ${loc.longitude}]`);
  }

  // 2. Build IP → agent_uuid map from DeviceStat
  const devices = await DeviceStat.find({ site_uuid: SIAB_SITE }).select('ip_address agent_uuid').lean();
  const ipToAgent = {};
  for (const d of devices) {
    if (d.ip_address && d.agent_uuid) ipToAgent[d.ip_address] = d.agent_uuid;
  }
  console.log(`\n=== DeviceStat Records (total ${devices.length}) ===`);
  const agentDeviceCount = {};
  for (const [ip, agent] of Object.entries(ipToAgent)) {
    agentDeviceCount[agent] = (agentDeviceCount[agent] || 0) + 1;
  }
  for (const [agent, count] of Object.entries(agentDeviceCount)) {
    console.log(`  • Agent ${agent}: ${count} unique IP(s) tracked`);
  }

  // 3. Sample flows to see dst_ip patterns
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const flowCount = await Flow.countDocuments({ site_uuid: SIAB_SITE, timestamp: { $gte: since24h } });
  const flows = await Flow.find({ site_uuid: SIAB_SITE, timestamp: { $gte: since24h } })
    .select('agent_uuid src_ip dst_ip download upload app_label')
    .limit(200)
    .lean();

  console.log(`\n=== Flows in Last 24h: ${flowCount} total (inspecting up to 200) ===`);

  const interAgentFlowMap = {};
  let matchCount = 0;

  for (const flow of flows) {
    const srcAgent = flow.agent_uuid;
    const dstAgent = ipToAgent[flow.dst_ip];
    if (srcAgent && dstAgent && srcAgent !== dstAgent) {
      matchCount++;
      const key = `${srcAgent} → ${dstAgent}`;
      if (!interAgentFlowMap[key]) {
        interAgentFlowMap[key] = { bytes: 0, count: 0, examples: [] };
      }
      interAgentFlowMap[key].bytes += (flow.download || 0) + (flow.upload || 0);
      interAgentFlowMap[key].count++;
      if (interAgentFlowMap[key].examples.length < 2) {
        interAgentFlowMap[key].examples.push({ src: flow.src_ip, dst: flow.dst_ip, app: flow.app_label });
      }
    }
  }

  console.log(`\n=== Inter-Agent Flows Detected: ${matchCount} (from ${flows.length} sampled) ===`);
  if (Object.keys(interAgentFlowMap).length > 0) {
    for (const [pair, data] of Object.entries(interAgentFlowMap)) {
      const mb = (data.bytes / 1024 / 1024).toFixed(2);
      console.log(`  ✓ ${pair} — ${data.count} flows, ${mb} MB`);
      for (const ex of data.examples) {
        console.log(`      Example: ${ex.src} → ${ex.dst} (${ex.app || 'Unclassified'})`);
      }
    }
  } else {
    console.log('  ✗ No inter-agent flows detected in sampled data.');
    console.log('\n  — Checking sample of dst_ip values that appear in flows...');
    const dstIps = [...new Set(flows.map(f => f.dst_ip).filter(Boolean))].slice(0, 10);
    console.log('  dst_ip samples:', dstIps);
    const matched = dstIps.filter(ip => ipToAgent[ip]);
    console.log('  dst_ip matched to agents:', matched.map(ip => `${ip} → ${ipToAgent[ip]}`));
  }

  // 4. Check if any flows have dst_ip in the devicestats table at all
  const allDstIps = [...new Set(flows.map(f => f.dst_ip).filter(Boolean))];
  let trackedCount = 0;
  for (const ip of allDstIps) {
    if (ipToAgent[ip]) trackedCount++;
  }
  console.log(`\n=== dst_ip Resolution: ${trackedCount} / ${allDstIps.length} unique dst IPs found in DeviceStat ===`);

  await mongoose.disconnect();
  console.log('\n✓ Done.\n');
}

run().catch(err => { console.error(err); process.exit(1); });
