const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const API_KEY = process.env.NETIFY_API_KEY;
const SITE_UUID = process.env.NETIFY_SITE_UUID;
const BASE = 'https://informatics.netify.ai/api/v1';

const headers = {
  'x-api-key': API_KEY,
  'x-net-site': SITE_UUID,
  'Accept': 'application/json'
};

async function inspect() {
  try {
    const res = await axios.get(`${BASE}/data/flows`, { headers, params: { settings_limit: 2 } });
    console.log('=== FLOW 0 ===');
    console.dir(res.data?.data?.[0], { depth: null });
  } catch (e) {
    console.error(e.message);
  }

  try {
    const res = await axios.get(`${BASE}/intelligence/discovery/devices`, { headers, params: { settings_limit: 2 } });
    console.log('=== DISCOVERY DEVICE 0 ===');
    console.dir(res.data?.data?.[0], { depth: null });
  } catch (e) {
    console.error(e.message);
  }
}

inspect();
