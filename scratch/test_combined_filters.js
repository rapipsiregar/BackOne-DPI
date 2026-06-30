const axios = require('axios');

const API_KEY = 'sk_db_live_ZjViMTNmODU3ZjNkN2Q4MGV';
const SITE_UUID = '6681452d_9cae_4ff4_8ae8_0d504774265e';
const BASE = 'https://informatics.netify.ai/api/v1';

const headers = {
  'x-api-key': API_KEY,
  'x-net-site': SITE_UUID,
  'Accept': 'application/json'
};

async function testCombinedFilters() {
  const agent = '2F-TF-1D-GK';
  const app = 'YouTube';
  try {
    const res = await axios.get(`${BASE}/data/stats/top/local_ip/download`, {
      headers,
      params: { filter_agent: agent, filter_application: app, settings_limit: 3 }
    });
    console.log(`top/local_ip for agent=${agent} and app=${app}:`, res.data?.data?.map(r => ({ ip: r.local_ip?.address, download: r.download })));
  } catch (e) {
    console.error(`Failed combined filters:`, e.message);
  }
}

testCombinedFilters();
