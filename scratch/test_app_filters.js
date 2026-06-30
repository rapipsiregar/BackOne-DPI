const axios = require('axios');

const API_KEY = 'sk_db_live_ZjViMTNmODU3ZjNkN2Q4MGV';
const SITE_UUID = '6681452d_9cae_4ff4_8ae8_0d504774265e';
const BASE = 'https://informatics.netify.ai/api/v1';

const headers = {
  'x-api-key': API_KEY,
  'x-net-site': SITE_UUID,
  'Accept': 'application/json'
};

async function testAppFilters() {
  // Let's first search for YouTube application ID
  let youtubeId = 15; // default guess or we can inspect flows/stats
  try {
    const res = await axios.get(`${BASE}/data/stats/top/local_ip/download`, {
      headers,
      params: { filter_application: 'YouTube', settings_limit: 3 }
    });
    console.log(`top/local_ip with filter_application=YouTube:`, res.data?.data?.map(r => ({ ip: r.local_ip?.address, download: r.download })));
  } catch (e) {
    console.error(`Failed filter_application=YouTube:`, e.message);
  }

  try {
    const res = await axios.get(`${BASE}/data/stats/top/local_ip/download`, {
      headers,
      params: { filter_application_id: youtubeId, settings_limit: 3 }
    });
    console.log(`top/local_ip with filter_application_id=${youtubeId}:`, res.data?.data?.map(r => ({ ip: r.local_ip?.address, download: r.download })));
  } catch (e) {
    console.error(`Failed filter_application_id=${youtubeId}:`, e.message);
  }

  // Test flows with application filter
  try {
    const res = await axios.get(`${BASE}/data/flows`, {
      headers,
      params: { filter_application: 'YouTube', settings_limit: 3 }
    });
    console.log(`flows with filter_application=YouTube:`, res.data?.data?.map(r => ({ src: r.local_ip?.address, dst: r.remote_ip?.address })));
  } catch (e) {
    console.error(`Failed flows filter_application=YouTube:`, e.message);
  }
}

testAppFilters();
