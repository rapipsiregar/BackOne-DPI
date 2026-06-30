const axios = require('axios');

const API_KEY = 'sk_db_live_ZjViMTNmODU3ZjNkN2Q4MGV';
const SITE_UUID = '6681452d_9cae_4ff4_8ae8_0d504774265e';
const BASE = 'https://informatics.netify.ai/api/v1';

const headers = {
  'x-api-key': API_KEY,
  'x-net-site': SITE_UUID,
  'Accept': 'application/json'
};

async function inspectLocalIpItem() {
  try {
    const res = await axios.get(`${BASE}/data/stats/top/local_ip/download`, {
      headers,
      params: { settings_limit: 1 }
    });
    console.log('=== local_ip item ===');
    console.dir(res.data?.data?.[0], { depth: null });
  } catch (e) {
    console.error(e.message);
  }
}

inspectLocalIpItem();
