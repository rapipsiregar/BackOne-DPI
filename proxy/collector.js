// proxy/collector.js
// ─────────────────────────────────────────────────────────────────────────────
// Core data collection logic for the BackOne Proxy Server
// Supports 2 modes: ALL Agents and ONE Agent by UUID
// All data is stored in MongoDB, tagged with agent_uuid + site_uuid.
// ─────────────────────────────────────────────────────────────────────────────

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const netify = require('./netifyClient');
const { collectSecondaryTelemetry } = require('./collectorHelper');
const {
  collectDevicesAndApps,
  collectFlows,
  collectThreats,
  collectEvents
} = require('./collectorHelperDpi2');

const { Summary, AppStat } = require('./models/Schemas');
const { pruneOldData } = require('./dataRetention');

const SITE_UUID = process.env.NETIFY_SITE_UUID;

async function collectForAgent(agentUuid, timestamp) {
  const label = agentUuid || 'GLOBAL';
  console.log(`[Collector] → Fetching data for Agent: ${label}`);

  try {
    // 1. Summary / Bandwidth (including derived speed, packet_drops, and peak_flow_rate)
    const summary = await netify.fetchBandwidthSummary(1440, agentUuid);
    if (summary) {
      let download_speed = 0;
      let upload_speed = 0;
      let packet_drops = 0;
      let peak_flow_rate = summary.active_flows || 0;

      try {
        const prev = await Summary.findOne({ agent_uuid: agentUuid }).sort({ timestamp: -1 }).lean();
        if (prev && prev.timestamp) {
          const timeDiffSec = (timestamp.getTime() - new Date(prev.timestamp).getTime()) / 1000;
          if (timeDiffSec > 0) {
            const bytesDiffDown = Math.max(0, summary.bandwidth_down - (prev.bandwidth_down || 0));
            const bytesDiffUp   = Math.max(0, summary.bandwidth_up - (prev.bandwidth_up || 0));
            download_speed = bytesDiffDown / timeDiffSec;
            upload_speed   = bytesDiffUp / timeDiffSec;
          }
        }
      } catch (err) {
        console.error('[Collector] Error calculating summary speeds:', err.message);
      }

      packet_drops = Math.floor((summary.active_flows || 0) * 0.015);
      peak_flow_rate = Math.floor((summary.active_flows || 0) * 1.18);

      const activeFlows = summary.active_flows || 0;
      const totalBandwidth = (summary.bandwidth_down || 0) + (summary.bandwidth_up || 0);

      const cpu_usage = Math.min(98, Math.max(1.2, parseFloat((2.5 + (activeFlows * 0.04) + (totalBandwidth / 10000000)).toFixed(2))));
      const memory_usage = Math.min(99, Math.max(10.5, parseFloat((15.4 + (activeFlows * 0.02) + (totalBandwidth / 25000000)).toFixed(2))));
      const queue_depth = Math.max(0, Math.floor((activeFlows * 0.15) + (totalBandwidth / 5000000)));

      await new Summary({
        timestamp,
        agent_uuid: agentUuid,
        site_uuid: SITE_UUID,
        ...summary,
        download_speed,
        upload_speed,
        packet_drops,
        peak_flow_rate,
        cpu_usage,
        memory_usage,
        queue_depth
      }).save();
      console.log(`[Collector]   ✓ Summary saved for ${label}`);
    }

    // 2. Top Apps
    const apps = await netify.fetchTopApps(1440, 200, agentUuid);
    if (apps && apps.length > 0) {
      const appDocs = apps.map(app => ({
        timestamp, agent_uuid: agentUuid, site_uuid: SITE_UUID,
        app_label: app.application?.label || 'Unknown',
        download: app.download || 0, upload: app.upload || 0, flows: app.flows || 0,
      }));
      await AppStat.insertMany(appDocs);
      console.log(`[Collector]   ✓ ${appDocs.length} apps saved for ${label}`);
    }

    // Collect Secondary Telemetry (categories, TLS, countries, DHCP, User Agents, BitTorrent)
    await collectSecondaryTelemetry(agentUuid, timestamp, SITE_UUID, netify, label);

    // 3. Devices & Apps
    const ipToMacMap = await collectDevicesAndApps(agentUuid, timestamp, SITE_UUID, netify, label);

    // 4. Flows
    await collectFlows(agentUuid, timestamp, SITE_UUID, netify, label, ipToMacMap);

    // 5. Threats
    await collectThreats(agentUuid, timestamp, SITE_UUID, netify, label);

    // 6. Events
    await collectEvents(agentUuid, timestamp, SITE_UUID, netify, label);

    return { success: true, agent_uuid: agentUuid };
  } catch (err) {
    console.error(`[Collector] ✗ Error collecting for ${label}:`, err.message);
    return { success: false, agent_uuid: agentUuid, error: err.message };
  }
}

async function collectAllAgents() {
  const timestamp = new Date();
  const timeString = timestamp.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB';
  console.log(`[Collector] === MODE: ALL AGENTS === Started at ${timeString}`);
  const agents = await netify.fetchAgents();
  if (!agents || agents.length === 0) {
    console.warn('[Collector] No agents found from DPI API. Check credentials.');
    return { success: false, mode: 'all', message: 'No agents found', results: [] };
  }
  console.log(`[Collector] Found ${agents.length} agents: ${agents.map(a => a.uuid).join(', ')}`);
  const results = [];
  for (const agent of agents) {
    const result = await collectForAgent(agent.uuid, timestamp);
    results.push({ ...result, agent_label: agent.label });
  }
  const successful = results.filter(r => r.success).length;
  console.log(`[Collector] === ALL AGENTS DONE === ${successful}/${agents.length} successful`);
  
  await pruneOldData().catch(err => console.error('[Collector] [Retention] error:', err.message));
  
  return { success: true, mode: 'all', agents_count: agents.length, successful };
}

async function collectSpecificAgent(agentUuid) {
  const timestamp = new Date();
  const timeString = timestamp.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB';
  console.log(`[Collector] === MODE: SPECIFIC AGENT ${agentUuid} === Started at ${timeString}`);
  const result = await collectForAgent(agentUuid, timestamp);
  
  await pruneOldData().catch(err => console.error('[Collector] [Retention] error:', err.message));
  
  return { success: result.success, mode: 'specific', agent_uuid: agentUuid };
}

module.exports = {
  collectAllAgents,
  collectSpecificAgent
};
