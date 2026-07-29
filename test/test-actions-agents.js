const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { getAgents } = require('../src/lib/actions/agents');

async function main() {
  const siteUuid = '6681452d_9cae_4ff4_8ae8_0d504774265e';
  console.log('Calling getAgents with site_uuid:', siteUuid);
  try {
    const agents = await getAgents(siteUuid);
    console.log(`Returned ${agents.length} agents:`);
    agents.forEach(a => {
      console.log(`- ID: ${a.id}, UUID: ${a.uuid}, Label: ${a.label}, Status: ${a.last_seen_at?.human}`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
