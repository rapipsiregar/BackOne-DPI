const axios = require('axios');

const API_KEY = 'sk_db_live_ZjViMTNmODU3ZjNkN2Q4MGV';
const SITE_UUID = '6681452d_9cae_4ff4_8ae8_0d504774265e';
const BASE = 'https://informatics.netify.ai/api/v1';

const headers = {
  'x-api-key': API_KEY,
  'x-net-site': SITE_UUID,
  'Accept': 'application/json'
};

async function testInterfaceFilter() {
  try {
    const res = await axios.get(`${BASE}/data/stats/top/local_ip/download`, {
      headers,
      params: { filter_interface: 'eth1 (LAN)', settings_limit: 3 }
    });
    console.log(`top/local_ip filter_interface=eth1 (LAN):`, res.data?.data?.map(r => r.local_ip?.address));
  } catch (e) {
    console.error('Failed filter_interface:', e.message);
  }

  try {
    // Let's get interfaces first to see their IDs
    const resI = await axios.get(`${BASE}/data/stats/top/interface/download`, { headers });
    const ifaces = resI.data?.data;
    console.log('Available interfaces:', ifaces?.map(i => ({ id: i.interface?.id, name: i.interface?.name, agent: i.interface?.agent_id })));
    
    if (ifaces && ifaces.length > 0) {
      const ifaceId = ifaces[0].interface?.id;
      const res = await axios.get(`${BASE}/data/stats/top/local_ip/download`, {
        headers,
        params: { filter_interface_id: ifaceId, settings_limit: 3 }
      });
      console.log(`top/local_ip filter_interface_id=${ifaceId}:`, res.data?.data?.map(r => r.local_ip?.address));
    }
  } catch (e) {
    console.error('Failed interface_id test:', e.message);
  }
}

testInterfaceFilter();
