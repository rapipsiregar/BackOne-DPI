const test = require('node:test');
const assert = require('node:assert');
const axios = require('axios');

// Save original axios get method
const originalGet = axios.get;

function mockAxiosGet(mockFn) {
  axios.get = mockFn;
}

function restoreAxiosGet() {
  axios.get = originalGet;
}

test.afterEach(() => {
  restoreAxiosGet();
});

test('fetchBandwidthSummary retrieves /data/stats/summary with correct filter_interval and outputs all metrics', async () => {
  const netify = require('../netify');

  mockAxiosGet(async (url, config) => {
    if (url.endsWith('/data/stats/summary')) {
      // Verify query params
      assert.strictEqual(config.params?.filter_interval, 1440);
      
      return {
        data: {
          status_code: 0,
          status_message: 'Success.',
          data: {
            download: 218648938113,
            upload: 33551656812,
            flow_hourly_count: 2970165,
            download_speed: 2530000,
            upload_speed: 390000,
            flow_speed: 123756
          }
        }
      };
    }
    throw new Error(`Unexpected mock URL: ${url}`);
  });

  const summary = await netify.fetchBandwidthSummary(1440);
  
  assert.ok(summary);
  assert.strictEqual(summary.download, 218648938113);
  assert.strictEqual(summary.upload, 33551656812);
  assert.strictEqual(summary.flows, 2970165);
  assert.strictEqual(summary.download_speed, 2530000);
  assert.strictEqual(summary.upload_speed, 390000);
  assert.strictEqual(summary.flow_speed, 123756);
});
