// test/agent_geolocation_test.js
const mongoose = require('../backend/node_modules/mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/backone_dpi';

const { CustomAgentLocation, DeviceStat, Flow } = require('../backend/models/Schemas');

let testCount = 0;
let passedCount = 0;

function assert(label, condition) {
  testCount++;
  if (condition) {
    console.log(`  ✓ PASSED: ${label}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAILED: ${label}`);
  }
}

async function runTests() {
  console.log('\n=========================================');
  console.log('  RUNNING TDD TESTS FOR GEOLOCATION & FLOWS');
  console.log('=========================================\n');

  try {
    // 1. Connect to DB
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // 2. Validate Geolocation Seeding
    const count = await CustomAgentLocation.countDocuments();
    assert('CustomAgentLocation collection should have seeded documents', count >= 3);

    const balarajaLoc = await CustomAgentLocation.findOne({ agent_uuid: 'F6-2V-DT-8A' });
    assert('CPI Balaraja Agent location should exist', !!balarajaLoc);
    if (balarajaLoc) {
      assert('CPI Balaraja latitude matches', balarajaLoc.latitude === -6.2263304);
      assert('CPI Balaraja longitude matches', balarajaLoc.longitude === 106.4247322);
      assert('CPI Balaraja belongs to SIAB site', balarajaLoc.site_uuid === '6681452d_9cae_4ff4_8ae8_0d504774265e');
    }

    const cibuburLoc = await CustomAgentLocation.findOne({ agent_uuid: '2F-TF-1D-GK' });
    assert('JRP Cibubur Agent location should exist', !!cibuburLoc);
    if (cibuburLoc) {
      assert('JRP Cibubur latitude matches', cibuburLoc.latitude === -6.3763318);
      assert('JRP Cibubur longitude matches', cibuburLoc.longitude === 106.8983017);
    }

    const ifgLoc = await CustomAgentLocation.findOne({ agent_uuid: '8A-V3-PB-85' });
    assert('IFG LT.18 Agent location should exist', !!ifgLoc);
    if (ifgLoc) {
      assert('IFG LT.18 latitude matches', ifgLoc.latitude === -6.2253265);
      assert('IFG LT.18 longitude matches', ifgLoc.longitude === 106.8061484);
    }

    // 3. Test Location Updates (Simulation of POST API)
    const testUuid = 'TEST-AGENT-UUID';
    const testSite = 'test-site-uuid';
    
    // Remove if exists
    await CustomAgentLocation.deleteOne({ agent_uuid: testUuid });
    
    const updated = await CustomAgentLocation.findOneAndUpdate(
      { agent_uuid: testUuid },
      {
        agent_uuid: testUuid,
        site_uuid: testSite,
        latitude: -6.1234,
        longitude: 106.1234,
        label: 'Test Location Label'
      },
      { new: true, upsert: true }
    );
    assert('Location upsert should return the saved document', !!updated);
    assert('Upserted latitude matches', updated.latitude === -6.1234);
    assert('Upserted longitude matches', updated.longitude === 106.1234);
    assert('Upserted label matches', updated.label === 'Test Location Label');

    // 4. Test Location Reset (Simulation of DELETE API)
    const delRes = await CustomAgentLocation.deleteOne({ agent_uuid: testUuid });
    assert('Location delete should succeed', delRes.deletedCount > 0);

    const checkedDel = await CustomAgentLocation.findOne({ agent_uuid: testUuid });
    assert('Location should no longer exist after delete', !checkedDel);

    // 5. Test Inter-Agent Flow Aggregation Logic
    // Let's seed a mock device belonging to Cibubur agent and a flow from Balaraja to Cibubur's device IP.
    const mockDestIp = '192.168.99.123';
    
    // Cleanup if existing
    await DeviceStat.deleteOne({ ip_address: mockDestIp });
    await Flow.deleteMany({ dst_ip: mockDestIp });

    // Seed mock device monitored by Cibubur agent (2F-TF-1D-GK)
    await DeviceStat.create({
      timestamp: new Date(),
      ip_address: mockDestIp,
      agent_uuid: '2F-TF-1D-GK',
      site_uuid: '6681452d_9cae_4ff4_8ae8_0d504774265e',
      mac_address: '00:11:22:33:44:55',
    });

    // Seed mock flow from Balaraja agent (F6-2V-DT-8A) to mockDestIp
    await Flow.create({
      timestamp: new Date(),
      agent_uuid: 'F6-2V-DT-8A',
      site_uuid: '6681452d_9cae_4ff4_8ae8_0d504774265e',
      src_ip: '192.168.10.50',
      dst_ip: mockDestIp,
      download: 15000000,
      upload: 5000000,
    });

    // Run the aggregation logic
    const devices = await DeviceStat.find({ site_uuid: '6681452d_9cae_4ff4_8ae8_0d504774265e' }).select('ip_address agent_uuid').lean();
    const deviceIpToAgent = {};
    for (const dev of devices) {
      if (dev.ip_address && dev.agent_uuid) {
        deviceIpToAgent[dev.ip_address] = dev.agent_uuid;
      }
    }

    const flows = await Flow.find({ site_uuid: '6681452d_9cae_4ff4_8ae8_0d504774265e' }).select('agent_uuid src_ip dst_ip download upload').lean();

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
            flowsCount: 0
          };
        }
        flowMap[key].bytes += ((flow.download || 0) + (flow.upload || 0));
        flowMap[key].flowsCount += 1;
      }
    }

    const result = Object.values(flowMap);
    assert('Inter-agent flows aggregation should detect flows', result.length > 0);
    
    const detectedFlow = result.find(f => f.source === 'F6-2V-DT-8A' && f.target === '2F-TF-1D-GK');
    assert('Mock flow from Balaraja to Cibubur should be detected', !!detectedFlow);
    if (detectedFlow) {
      assert('Mock flow bytes matches (15MB down + 5MB up = 20MB)', detectedFlow.bytes >= 20000000);
      assert('Mock flow connection count is correct', detectedFlow.flowsCount >= 1);
    }

    // Cleanup mock telemetry
    await DeviceStat.deleteOne({ ip_address: mockDestIp });
    await Flow.deleteMany({ dst_ip: mockDestIp });

    console.log('\n=========================================');
    console.log(`  RESULT: ${passedCount} / ${testCount} tests passed.`);
    console.log('=========================================\n');

    await mongoose.disconnect();
  } catch (err) {
    console.error('TDD Test run error:', err);
    process.exit(1);
  }
}

runTests();
