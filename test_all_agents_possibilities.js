const axios = require('axios');

const API_KEY = 'sk_db_live_ZjViMTNmODU3ZjNkN2Q4MGV';
const SITE_UUID = '6681452d_9cae_4ff4_8ae8_0d504774265e';

const targets = [
  // portal.netify.ai
  'https://portal.netify.ai/api/v2/assets/agents',
  'https://portal.netify.ai/api/v2/agents',
  'https://portal.netify.ai/api/v1/assets/agents',
  'https://portal.netify.ai/api/v1/agents',
  
  // informatics.netify.ai
  'https://informatics.netify.ai/api/v2/assets/agents',
  'https://informatics.netify.ai/api/v2/agents',
  'https://informatics.netify.ai/api/v1/assets/agents',
  'https://informatics.netify.ai/api/v1/agents',
  
  // manager.netify.ai
  'https://manager.netify.ai/api/v2/assets/agents',
  'https://manager.netify.ai/api/v2/agents',
  'https://manager.netify.ai/api/v1/assets/agents',
  'https://manager.netify.ai/api/v1/agents',
];

async function test(url) {
  console.log(`[Testing] ${url}`);
  try {
    const res = await axios.get(url, {
      headers: {
        'x-api-key': API_KEY,
        'x-net-site': SITE_UUID,
        'Accept': 'application/json'
      },
      timeout: 5000
    });
    console.log(`  -> SUCCESS [${res.status}]:`, JSON.stringify(res.data).substring(0, 300));
  } catch (err) {
    const code = err.response?.status || 'ERR';
    const msg = JSON.stringify(err.response?.data || err.message);
    console.log(`  -> FAILED [${code}]:`, msg.substring(0, 150));
  }
}

async function run() {
  for (const url of targets) {
    await test(url);
  }
}

run();
