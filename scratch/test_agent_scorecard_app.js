const axios = require('axios');

const API_KEY = 'sk_db_live_ZjViMTNmODU3ZjNkN2Q4MGV';
const SITE_UUID = '6681452d_9cae_4ff4_8ae8_0d504774265e';
const BASE = 'https://informatics.netify.ai/api/v1';

const headers = {
  'x-api-key': API_KEY,
  'x-net-site': SITE_UUID,
  'Accept': 'application/json'
};

async function testAgentScorecardAppFilter() {
  const app = 'YouTube';
  try {
    const res = await axios.get(`${BASE}/data/stats/scorecard/agent/download`, {
      headers,
      params: { filter_application: app }
    });
    console.log(`Agent scorecard filtered by application=${app}:`, res.data?.data?.map(r => ({ agent: r.agent?.uuid, download: r.download })));
  } catch (e) {
    console.error('Failed:', e.message);
  }
}

testAgentScorecardAppFilter();
