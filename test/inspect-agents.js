const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/backone_dpi";

async function run() {
  console.log('Connecting to Production MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const db = mongoose.connection.db;
  const agents = await db.collection('agent_registry').find({}).toArray();
  console.log('Total agents in agent_registry:', agents.length);
  for (const agent of agents) {
    console.log(`Agent UUID: ${agent.uuid}, Label: ${agent.label}, Site UUID: ${agent.site_uuid}, Organization: ${agent.organization_uuid}`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
