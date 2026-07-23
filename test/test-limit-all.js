const { netifyFetch } = require('../proxy/netifyClientCore');
require('dotenv').config({ path: './.env.local' });

async function main() {
  console.log('Fetching with limit 5000...');
  const start = Date.now();
  const data = await netifyFetch('/lookup/applications', { settings_limit: 5000 });
  console.log('Done in:', Date.now() - start, 'ms');
  console.log('Returned items count:', data?.length);
  if (data && data.length > 0) {
    console.log('First item:', data[0].id, data[0].name);
    console.log('Last item:', data[data.length - 1].id, data[data.length - 1].name);
  }
}

main().catch(console.error);
