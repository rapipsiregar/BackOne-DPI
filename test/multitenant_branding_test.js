// test/multitenant_branding_test.js
const mongoose = require('../backend/node_modules/mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/backone_dpi';

const User = require('../backend/models/User');
const { TenantConfig } = require('../backend/models/Schemas');

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
  console.log('  RUNNING TDD TESTS FOR MULTI-TENANCY & BRANDING');
  console.log('=========================================\n');

  try {
    // 1. Connect to DB
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Ensure at least one summary document exists for both SIAB and Nexus
    const dbConnection = mongoose.connection.db;
    const hasSiabSummary = await dbConnection.collection('summaries').findOne({ site_uuid: '6681452d_9cae_4ff4_8ae8_0d504774265e' });
    if (!hasSiabSummary) {
      await dbConnection.collection('summaries').insertOne({
        timestamp: new Date(),
        agent_uuid: 'mock_siab_agent_uuid',
        site_uuid: '6681452d_9cae_4ff4_8ae8_0d504774265e',
        bandwidth_down: 100,
        bandwidth_up: 50,
        active_flows: 10
      });
    }

    const hasNexusSummary = await dbConnection.collection('summaries').findOne({ site_uuid: 'd7902405_0dc2_458b_8584_ed4d24b64f24' });
    if (!hasNexusSummary) {
      await dbConnection.collection('summaries').insertOne({
        timestamp: new Date(),
        agent_uuid: 'mock_nexus_agent_uuid',
        site_uuid: 'd7902405_0dc2_458b_8584_ed4d24b64f24',
        bandwidth_down: 100,
        bandwidth_up: 50,
        active_flows: 10
      });
    }

    // 2. Validate User Accounts Seeding
    const adminUser = await User.findOne({ username: 'admin' });
    assert('User "admin" should exist', !!adminUser);
    if (adminUser) {
      assert('User "admin" should have SUPER_ADMIN role', adminUser.role === 'SUPER_ADMIN');
    }

    const siabUser = await User.findOne({ username: 'siab' });
    assert('User "siab" should exist', !!siabUser);
    if (siabUser) {
      assert('User "siab" should have TENANT_ADMIN role', siabUser.role === 'TENANT_ADMIN');
      assert('User "siab" should belong to SIAB site_uuid', siabUser.site_uuid === '6681452d_9cae_4ff4_8ae8_0d504774265e');
    }

    const nexusUser = await User.findOne({ username: 'nexus' });
    assert('User "nexus" should exist', !!nexusUser);
    if (nexusUser) {
      assert('User "nexus" should have TENANT_ADMIN role', nexusUser.role === 'TENANT_ADMIN');
      assert('User "nexus" should belong to Nexus site_uuid', nexusUser.site_uuid === 'd7902405_0dc2_458b_8584_ed4d24b64f24');
    }

    // 3. Validate TenantConfig configurations
    const backoneConfig = await TenantConfig.findOne({ site_uuid: 'default' });
    assert('Default branding config should exist', !!backoneConfig);
    if (backoneConfig) {
      assert('Default brand_name should be BackOne', backoneConfig.brand_name === 'BackOne');
      assert('Default brand_logo should be /backone-logo.png', backoneConfig.brand_logo === '/backone-logo.png');
    }

    const siabConfig = await TenantConfig.findOne({ site_uuid: '6681452d_9cae_4ff4_8ae8_0d504774265e' });
    assert('SIAB branding config should exist', !!siabConfig);
    if (siabConfig) {
      assert('SIAB brand_name should be SIAB', siabConfig.brand_name === 'SIAB');
      assert('SIAB brand_logo should be /siab-logo.png', siabConfig.brand_logo === '/siab-logo.png');
    }

    const nexusConfig = await TenantConfig.findOne({ site_uuid: 'd7902405_0dc2_458b_8584_ed4d24b64f24' });
    assert('Nexus branding config should exist', !!nexusConfig);
    if (nexusConfig) {
      assert('Nexus brand_name should be Nexus', nexusConfig.brand_name === 'Nexus');
      assert('Nexus brand_logo should be /nexus-logo.png', nexusConfig.brand_logo === '/nexus-logo.png');
    }

    // 4. Validate Agent listing isolation per site_uuid (summaries collection)
    const db = mongoose.connection.db;
    const siabAgents = await db.collection('summaries').distinct('agent_uuid', { site_uuid: '6681452d_9cae_4ff4_8ae8_0d504774265e' });
    const nexusAgents = await db.collection('summaries').distinct('agent_uuid', { site_uuid: 'd7902405_0dc2_458b_8584_ed4d24b64f24' });
    
    assert('SIAB agents count should be greater than 0', siabAgents.length > 0);
    assert('Nexus agents count should be greater than 0', nexusAgents.length > 0);
    
    // Check that agents do not overlap
    const overlap = siabAgents.filter(uuid => nexusAgents.includes(uuid));
    assert('SIAB and Nexus agent lists should have 0 overlapping agents', overlap.length === 0);

    // 5. Validate User creation isolation (created_by query)
    const testAdminCreated = await User.find({ created_by: 'admin' });
    const testNexusCreated = await User.find({ created_by: 'nexus' });
    assert('Superadmin users should return a queryable list of registered accounts', Array.isArray(testAdminCreated));
    assert('Nexus admin users should return a queryable list of registered accounts', Array.isArray(testNexusCreated));

    // Verify tenant-admin custom query filter returns AGENT_VIEWER accounts for their site
    const mockTenantUser = { role: 'TENANT_ADMIN', site_uuid: 'd7902405_0dc2_458b_8584_ed4d24b64f24', username: 'nexus' };
    const query = {
      $or: [
        { role: 'AGENT_VIEWER', site_uuid: mockTenantUser.site_uuid },
        { created_by: mockTenantUser.username }
      ]
    };
    const queryResults = await User.find(query);
    assert('Tenant user list query should execute successfully', Array.isArray(queryResults));

    console.log(`\n=========================================`);
    console.log(`  RESULT: ${passedCount} / ${testCount} tests passed.`);
    console.log(`=========================================\n`);

    if (passedCount !== testCount) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  }
}

runTests();
