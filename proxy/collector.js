// proxy/collector.js
// ─────────────────────────────────────────────────────────────────────────────
// Core data collection orchestrator for the BackOne Proxy Server
// All data is stored in MongoDB, tagged with agent_uuid + site_uuid.
// ─────────────────────────────────────────────────────────────────────────────

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const backone = require('./backoneClient');
const { AgentRegistry } = require('./models/Schemas');
const { pruneOldData } = require('./dataRetention');
const { collectForAgent, collectSiteSummary } = require('./collectorCore');

const SITE_UUIDS_STR = process.env.BACKONE_SITE_UUIDS || process.env.BACKONE_SITE_UUID;
const SITE_UUIDS = SITE_UUIDS_STR ? SITE_UUIDS_STR.split(',').map(s => s.trim()).filter(Boolean) : [];

async function collectAllAgents() {
  const timestamp = new Date();
  const timeString = timestamp.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB';
  console.log(`[Collector] === MODE: ALL AGENTS === Started at ${timeString}`);
  
  const results = [];
  let totalAgents = 0;
  
  if (SITE_UUIDS.length === 0) {
    console.warn('[Collector] No BACKONE_SITE_UUIDS configured.');
    return { success: false, mode: 'all', message: 'No sites configured', results: [] };
  }

  const processedAgentUuids = new Set();

  for (const siteUuid of SITE_UUIDS) {
    console.log(`[Collector] Fetching agents for Site: ${siteUuid}`);
    const rawAgents = await backone.fetchAgents(siteUuid);
    if (!rawAgents || rawAgents.length === 0) {
      console.warn(`[Collector] No agents found for site ${siteUuid}.`);
      continue;
    }
    
    const agents = rawAgents.filter(a => {
      if (processedAgentUuids.has(a.uuid)) {
        console.log(`[Collector] Skipping agent ${a.uuid} — already assigned to another site.`);
        return false;
      }
      return true;
    });

    if (agents.length === 0) {
      console.warn(`[Collector] No unique agents for site ${siteUuid}. Skipping.`);
      continue;
    }

    for (const agent of agents) processedAgentUuids.add(agent.uuid);

    await Promise.allSettled(agents.map(a =>
      AgentRegistry.findOneAndUpdate(
        { uuid: a.uuid },
        {
          $set: {
            uuid:         a.uuid,
            serial:       a.serial || a.uuid,
            label:        a.label,
            site_uuid:    siteUuid,
            provisioned:  a.provisioned ?? true,
            activated:    a.activated ?? false,
            last_seen_at: a.last_seen_at ?? null,
          }
        },
        { upsert: true, new: true }
      )
    ));
    console.log(`[Collector]   ✓ ${agents.length} agents upserted into registry for site ${siteUuid}`);

    totalAgents += agents.length;
    console.log(`[Collector] Processing ${agents.length} agents for site ${siteUuid}`);

    await collectSiteSummary(siteUuid, timestamp);

    for (const agent of agents) {
      const result = await collectForAgent(agent.uuid, timestamp, siteUuid);
      results.push({ ...result, agent_label: agent.label, site_uuid: siteUuid });
    }
  }

  const successful = results.filter(r => r.success).length;
  console.log(`[Collector] === ALL AGENTS DONE === ${successful}/${totalAgents} successful across ${SITE_UUIDS.length} sites`);
  
  await pruneOldData().catch(err => console.error('[Collector] [Retention] error:', err.message));
  
  return { success: true, mode: 'all', agents_count: totalAgents, successful };
}

async function collectSpecificAgent(agentUuid, siteUuid = SITE_UUIDS[0]) {
  const result = await collectSpecificAgents([agentUuid], siteUuid, 0);
  return { success: result.successful > 0, mode: 'specific', agent_uuid: agentUuid };
}

async function collectSpecificAgents(agentUuids, siteUuid = SITE_UUIDS[0], delayMs = 5000) {
  const timestamp = new Date();
  const timeString = timestamp.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB';
  console.log(`[Collector] === MODE: SPECIFIC AGENTS [${agentUuids.join(', ')}] === Started at ${timeString}`);
  const results = [];
  for (let i = 0; i < agentUuids.length; i++) {
    if (i > 0) {
      console.log(`[Collector] Waiting ${delayMs}ms before next agent...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    const result = await collectForAgent(agentUuids[i], timestamp, siteUuid);
    results.push(result);
  }
  const successful = results.filter(r => r.success).length;
  console.log(`[Collector] === SPECIFIC AGENTS DONE === ${successful}/${agentUuids.length} successful`);

  await pruneOldData().catch(err => console.error('[Collector] [Retention] error:', err.message));

  return { success: true, mode: 'specific_agents', agents_count: agentUuids.length, successful, results };
}

module.exports = {
  collectAllAgents,
  collectSpecificAgent,
  collectSpecificAgents
};
