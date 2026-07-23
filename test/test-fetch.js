const path = require('path');
require('dotenv').config({ path: './.env.local' });
const { netifyFetch } = require('../proxy/netifyClientCore');

async function main() {
  console.log('Testing netifyFetch...');
  console.log('API Key:', process.env.NETIFY_API_KEY);
  
  const start = Date.now();
  const data = await netifyFetch('/lookup/applications', { settings_limit: 5 });
  console.log('Done in:', Date.now() - start, 'ms');
  console.log('Data:', data);
}

main().catch(console.error);
