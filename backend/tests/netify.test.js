const test = require('node:test');
const assert = require('node:assert');
const axios = require('axios');

// Save the original axios get method
const originalGet = axios.get;

// Helper to mock axios.get response
function mockAxiosGet(mockFn) {
  axios.get = mockFn;
}

// Restore original axios get
function restoreAxiosGet() {
  axios.get = originalGet;
}

test.afterEach(() => {
  restoreAxiosGet();
});

test('fetchEvents parses raw events successfully', async () => {
  const netify = require('../netify');

  // Mock API response
  mockAxiosGet(async (url, config) => {
    if (url.endsWith('/event/events')) {
      return {
        data: {
          status_code: 0,
          status_message: 'Success.',
          data: [
            {
              id: 254,
              basename: 'new.device',
              severity: 10,
              label: 'New device detected',
              description: JSON.stringify({
                default: 'New device {{ device_label }} discovered',
                tags: {
                  device_label: 'Linux Device',
                  device_ip: '192.168.1.100'
                }
              }),
              created_at: {
                date: '2026-06-29 10:46:20'
              }
            }
          ]
        }
      };
    }
    throw new Error(`Unexpected mock URL: ${url}`);
  });

  const parsed = await netify.fetchEvents(50);
  assert.ok(Array.isArray(parsed));
  assert.strictEqual(parsed.length, 1);

  const event = parsed[0];
  assert.strictEqual(event.event_id, 254);
  assert.strictEqual(event.event_type, 'new.device');
  assert.strictEqual(event.severity, 'Warning');
  assert.strictEqual(event.description, 'New device Linux Device discovered');
  assert.strictEqual(event.ip_address, '192.168.1.100');
  assert.strictEqual(event.event_at, '2026-06-29 10:46:20');
});

test('fetchDiscoveredDevices merges devices and flows successfully', async () => {
  const netify = require('../netify');

  mockAxiosGet(async (url, config) => {
    if (url.endsWith('/intelligence/discovery/devices')) {
      return {
        data: {
          status_code: 0,
          data: [
            {
              ip: { address: '10.250.192.226' },
              mac_address: 'b2:87:41:96:a7:7b',
              mac_vendor: 'Local',
              discovery_mac: {
                address: 'b2:87:41:96:a7:7b',
                discovery_hardware: 'Linux Device'
              },
              discovery_type: { label: 'Computer' },
              discovery_os: { label: 'Linux' }
            }
          ]
        }
      };
    }
    if (url.endsWith('/data/stats/top/local_ip/download')) {
      return {
        data: {
          status_code: 0,
          data: [
            { local_ip: { address: '10.250.192.226' }, download: 1000000 }
          ]
        }
      };
    }
    if (url.endsWith('/data/stats/top/local_ip/upload')) {
      return {
        data: {
          status_code: 0,
          data: [
            { local_ip: { address: '10.250.192.226' }, upload: 500000 }
          ]
        }
      };
    }
    throw new Error(`Unexpected mock URL: ${url}`);
  });

  const devices = await netify.fetchDiscoveredDevices(1440, 50);
  assert.ok(Array.isArray(devices));
  assert.strictEqual(devices.length, 1);

  const dev = devices[0];
  assert.strictEqual(dev.ip_address, '10.250.192.226');
  assert.strictEqual(dev.mac_address, 'b2:87:41:96:a7:7b');
  assert.strictEqual(dev.download, 1000000);
  assert.strictEqual(dev.upload, 500000);
});
