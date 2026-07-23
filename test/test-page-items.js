const { netifyFetch } = require('../proxy/netifyClientCore');
require('dotenv').config({ path: './.env.local' });

async function main() {
  const p1 = await netifyFetch('/lookup/applications', { settings_limit: 5, settings_page: 1 });
  const p2 = await netifyFetch('/lookup/applications', { settings_limit: 5, settings_page: 2 });
  
  console.log('Page 1 items:', p1.map(x => ({ id: x.id, name: x.name })));
  console.log('Page 2 items:', p2.map(x => ({ id: x.id, name: x.name })));
}

main().catch(console.error);
