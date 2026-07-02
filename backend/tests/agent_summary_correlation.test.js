const test = require('node:test');
const assert = require('node:assert');

// Require the database module to mock it before loading the router
const db = require('../database');

const originalGetStats = db.getStats;
const originalGetTimeline = db.getBandwidthTimeline;

test.afterEach(() => {
  db.getStats = originalGetStats;
  db.getBandwidthTimeline = originalGetTimeline;
});

test('GET /summary scales metrics proportionally for AGENT_VIEWER based on database traffic share', async () => {
  // Mock db.getStats
  db.getStats = (siteUuid, agentUuid) => {
    if (agentUuid === '8A-V3-PB-85') {
      return { totalDevices: 5, totalThreats: 1, totalEvents: 10, lastFetch: '2026-07-02T01:00:00Z', activeFlows: 50 };
    }
    // Site wide
    return { totalDevices: 20, totalThreats: 2, totalEvents: 50, lastFetch: '2026-07-02T01:00:00Z', activeFlows: 200 };
  };

  // Mock db.getBandwidthTimeline
  db.getBandwidthTimeline = (points, siteUuid, agentUuid) => {
    if (agentUuid === '8A-V3-PB-85') {
      return [{ fetched_at: '2026-07-02T01:00:00Z', total_download: 50000000, total_upload: 10000000 }];
    }
    // Site wide
    return [{
      fetched_at: '2026-07-02T01:00:00Z',
      total_download: 200000000,
      total_upload: 40000000,
      total_flows: 100000,
      download_speed: 8000000,
      upload_speed: 2000000,
      flow_speed: 120000
    }];
  };

  // Load the dashboard router
  const router = require('../routes/dashboard');
  const layer = router.stack.find(l => l.route && l.route.path === '/summary');
  assert.ok(layer, 'Dashboard router should have a /summary route');
  const handler = layer.route.stack[0].handle;

  // Mock req and res for AGENT_VIEWER
  const req = {
    user: {
      role: 'AGENT_VIEWER',
      agent_uuid: '8A-V3-PB-85',
      site_uuid: '6681452d_9cae_4ff4_8ae8_0d504774265e'
    }
  };

  let responseData = null;
  const res = {
    json(payload) {
      responseData = payload;
    }
  };

  // Execute the route handler
  await handler(req, res);

  // Assert proportional scaling is correct
  assert.ok(responseData);
  assert.strictEqual(responseData.ok, true);
  
  const data = responseData.data;
  assert.ok(data);
  // Unaltered metrics
  assert.strictEqual(data.total_devices, 5);
  assert.strictEqual(data.total_threats, 1);
  assert.strictEqual(data.total_events, 10);
  assert.strictEqual(data.bandwidth_down, 50000000);
  assert.strictEqual(data.bandwidth_up, 10000000);

  // Scaled metrics (agent has 25% share of downloads, uploads, and flows)
  assert.strictEqual(data.active_flows, 25000);
  assert.strictEqual(data.download_speed, 2000000);
  assert.strictEqual(data.upload_speed, 500000);
  assert.strictEqual(data.flow_speed, 30000);
});
