const { netifyFetch } = require('../proxy/netifyClientCore');
require('dotenv').config({ path: './.env.local' });

async function main() {
  const p1 = await netifyFetch('/lookup/applications', { settings_limit: 5, settings_page: 1 });
  const p2 = await netifyFetch('/lookup/applications', { settings_limit: 5, settings_page: 2 });
  
  console.log('Page 1 length:', p1?.length);
  console.log('Page 2 length:', p2?.length);
  if (p1 && p1.length > 0) {
    console.log('Page 1 first item:', p1[0].id, p1[0].name);
  }
  if (p2 && p2.length > 0) {
    console.log('Page 2 first item:', p2[0].id, p2[0].name);
  }
}

main().catch(console.error);
