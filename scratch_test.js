const fs = require('fs');
const fetch = global.fetch;

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const match = line.match(/^([^#\s=]+)=(.*)$/);
  if (match) {
    acc[match[1]] = match[2];
  }
  return acc;
}, {});

async function test() {
  try {
    const API_URL = env.NETIFY_BASE_URL ? env.NETIFY_BASE_URL + '/assets/agents' : 'https://manager.netify.ai/api/v1/assets/agents';
    const headers = { 'Content-Type': 'application/json' };
    
    if (env.NETIFY_JWT_TOKEN && env.NETIFY_SITE_UUID) {
      headers['x-api-key'] = env.NETIFY_JWT_TOKEN;
      headers['x-net-site'] = env.NETIFY_SITE_UUID;
    } else if (env.NETIFY_API_KEY) {
      headers['x-api-key'] = env.NETIFY_API_KEY;
    }
    
    console.log('Fetching', API_URL);
    console.log('Headers:', Object.keys(headers));
    
    const res = await fetch(API_URL, { headers });
    console.log('Status:', res.status, res.statusText);
    const data = await res.text();
    console.log('Data:', data.substring(0, 500));
  } catch(e) {
    console.error(e);
  }
}
test();
