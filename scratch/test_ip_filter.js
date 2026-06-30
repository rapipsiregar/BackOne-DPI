const axios = require('axios');

const API_KEY = 'sk_db_live_ZjViMTNmODU3ZjNkN2Q4MGV';
const SITE_UUID = '6681452d_9cae_4ff4_8ae8_0d504774265e';
const BASE = 'https://informatics.netify.ai/api/v1';

const headers = {
  'x-api-key': API_KEY,
  'x-net-site': SITE_UUID,
  'Accept': 'application/json'
};

async function testIpFilter() {
  const ip = '10.250.192.202';
  try {
    const res = await axios.get(`${BASE}/data/stats/top/application/download`, {
      headers,
      params: { filter_local_ip: ip, settings_limit: 3 }
    });
    console.log(`Top apps for IP ${ip}:`, res.data?.data?.map(a => ({ name: a.application?.label, download: a.download })));
  } catch (e) {
    console.error(`Failed filter_local_ip:`, e.message);
  }

  try {
    const res = await axios.get(`${BASE}/data/stats/top/application/download`, {
      headers,
      params: { filter_ip: ip, settings_limit: 3 }
    });
    console.log(`Top apps for IP ${ip} (filter_ip):`, res.data?.data?.map(a => ({ name: a.application?.label, download: a.download })));
  } catch (e) {
    console.error(`Failed filter_ip:`, e.message);
  }
}

testIpFilter();
