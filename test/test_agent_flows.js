// test/test_agent_flows.js
const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/backone_dpi');
  console.log("Connected to MongoDB");

  const { DeviceStat, Flow } = require('../backend/models/Schemas');

  const siteUuid = '6681452d_9cae_4ff4_8ae8_0d504774265e';

  // Build IP-to-Agent mapping from DeviceStat
  console.log("Querying devices...");
  const devices = await DeviceStat.find({ site_uuid: siteUuid }).select('ip_address agent_uuid').lean();
  console.log(`Found ${devices.length} devices`);

  const deviceIpToAgent = {};
  for (const dev of devices) {
    if (dev.ip_address && dev.agent_uuid) {
      deviceIpToAgent[dev.ip_address] = dev.agent_uuid;
    }
  }

  // Query flows
  console.log("Querying flows...");
  const flows = await Flow.find({ site_uuid: siteUuid }).select('agent_uuid src_ip dst_ip download upload app_label').lean();
  console.log(`Found ${flows.length} flows`);

  const flowMap = {};
  for (const flow of flows) {
    const srcAgent = flow.agent_uuid;
    const dstAgent = deviceIpToAgent[flow.dst_ip];

    if (srcAgent && dstAgent && srcAgent !== dstAgent) {
      const key = `${srcAgent}->${dstAgent}`;
      if (!flowMap[key]) {
        flowMap[key] = {
          source: srcAgent,
          target: dstAgent,
          bytes: 0,
          flowsCount: 0,
          details: []
        };
      }
      const bytes = ((flow.download || 0) + (flow.upload || 0));
      flowMap[key].bytes += bytes;
      flowMap[key].flowsCount += 1;
      flowMap[key].details.push({
        src_ip: flow.src_ip,
        dst_ip: flow.dst_ip,
        app: flow.app_label || 'Unclassified',
        bytes: bytes
      });
    }
  }

  const result = Object.values(flowMap);
  console.log(`Generated ${result.length} agent flows`);
  
  await mongoose.disconnect();
  console.log("Disconnected from MongoDB");
}

test().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
