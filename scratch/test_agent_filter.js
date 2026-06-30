const axios = require('axios');
const path = require('path');

const API_KEY = 'sk_db_live_ZjViMTNmODU3ZjNkN2Q4MGV';
const SITE_UUID = '6681452d_9cae_4ff4_8ae8_0d504774265e';
const BASE = 'https://informatics.netify.ai/api/v1';

const headers = {
  'x-api-key': API_KEY,
  'x-net-site': SITE_UUID,
  'Accept': 'application/json'
};

async function testAgentFilter() {
  const agents = ["2F-TF-1D-GK", "8A-V3-PB-85", "F6-2V-DT-8A"];
  
  for (const agent of agents) {
    console.log(`\n=== Testing Agent ${agent} ===`);
    
    // Test stats summary
    try {
      const res = await axios.get(`${BASE}/data/stats/summary`, {
        headers,
        params: { filter_agent: agent }
      });
      console.log(`stats/summary filter_agent=${agent}:`, JSON.stringify(res.data?.data));
    } catch (e) {
      console.log(`stats/summary filter_agent=${agent} failed:`, e.message);
    }

    // Test top local_ip
    try {
      const res = await axios.get(`${BASE}/data/stats/top/local_ip/download`, {
        headers,
        params: { filter_agent: agent, settings_limit: 3 }
      });
      const ips = res.data?.data?.map(r => r.local_ip?.address || r.local_ip);
      console.log(`top/local_ip filter_agent=${agent}:`, ips);
    } catch (e) {
      console.log(`top/local_ip filter_agent=${agent} failed:`, e.message);
    }

    // Test flows
    try {
      const res = await axios.get(`${BASE}/data/flows`, {
        headers,
        params: { filter_agent: agent, settings_limit: 3 }
      });
      const flows = res.data?.data?.map(r => `${r.local_ip?.address} -> ${r.remote_ip?.address}`);
      console.log(`flows filter_agent=${agent}:`, flows);
    } catch (e) {
      console.log(`flows filter_agent=${agent} failed:`, e.message);
    }
  }
}

testAgentFilter();
