// Test: cari field name yang valid untuk SNI hostname di API
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const API_KEY = process.env.NETIFY_API_KEY;
const SITE_UUID = process.env.NETIFY_SITE_UUID;
const BASE = 'https://informatics.netify.ai/api/v1';

const headers = {
  'x-api-key': API_KEY,
  'x-net-site': SITE_UUID,
  'Accept': 'application/json'
};

async function tryField(field) {
  try {
    const url = `${BASE}/data/stats/top/${field}/download`;
    const res = await axios.get(url, { headers, params: { filter_interval: 1440, settings_limit: 5 }, timeout: 10000 });
    const data = res.data?.data;
    if (data && Array.isArray(data) && data.length > 0) {
      console.log(`✅ ${field}: OK, count=${data.length}, keys=${Object.keys(data[0])}`);
      console.log(`   First: ${JSON.stringify(data[0]).slice(0, 200)}`);
    } else {
      console.log(`⚠️  ${field}: OK but empty`);
    }
  } catch (err) {
    const status = err.response?.status;
    const msg = err.response?.data?.status_message || err.message;
    console.log(`❌ ${field}: ${status} - ${msg?.slice(0, 100)}`);
  }
}

async function run() {
  // Try all possible SNI-related field names
  const candidates = [
    'https_sni_hostname',
    'sni_hostname',
    'ssl_sni',
    'tls_sni',
    'ssl_server_cn',
    'quic_hostname',
    'hostname'
  ];
  
  console.log('=== Testing SNI/Hostname field names ===\n');
  for (const f of candidates) {
    await tryField(f);
  }
}

run();
