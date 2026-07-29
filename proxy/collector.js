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
const { collectDevicesAndApps, collectFlows } = require('./collectorHelperDpi2');
const { collectThreats, collectEvents } = require('./collectorHelperDpi3');

const { Summary, AppStat, AgentRegistry } = require('./models/Schemas');
const { pruneOldData } = require('./dataRetention');

const SITE_UUIDS_STR = process.env.NETIFY_SITE_UUIDS || process.env.NETIFY_SITE_UUID;
const SITE_UUIDS = SITE_UUIDS_STR ? SITE_UUIDS_STR.split(',').map(s => s.trim()).filter(Boolean) : [];

async function collectForAgent(agentUuid, timestamp, siteUuid) {
  const label = agentUuid || 'GLOBAL';
  console.log(`[Collector] → Fetching data for Agent: ${label}`);

  try {
    // 1. Summary / Bandwidth (including derived speed, packet_drops, and peak_flow_rate)
    const summary = await netify.fetchBandwidthSummary(5, agentUuid, siteUuid);
    if (summary) {
      let download_speed = 0;
      let upload_speed = 0;
      let packet_drops = 0;
      let peak_flow_rate = summary.active_flows || 0;

      try {
        const prev = await Summary.findOne({ agent_uuid: agentUuid }).sort({ timestamp: -1 }).lean();
        const timeDiffSec = prev && prev.timestamp ? (timestamp.getTime() - new Date(prev.timestamp).getTime()) / 1000 : 300;
        const activeTimeDiff = timeDiffSec > 0 ? timeDiffSec : 300;
        download_speed = summary.bandwidth_down / activeTimeDiff;
        upload_speed   = summary.bandwidth_up / activeTimeDiff;
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
        site_uuid: siteUuid,
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
    const apps = await netify.fetchTopApps(5, 200, agentUuid, siteUuid);
    if (apps && apps.length > 0) {
      const appDocs = apps.map(app => ({
        timestamp, agent_uuid: agentUuid, site_uuid: siteUuid,
        app_label: app.application?.label || 'Unknown',
        download: app.download || 0, upload: app.upload || 0, flows: app.flows || 0,
      }));
      await AppStat.insertMany(appDocs);
      console.log(`[Collector]   ✓ ${appDocs.length} apps saved for ${label}`);
    }

    // Collect Secondary Telemetry (categories, TLS, countries, DHCP, User Agents, BitTorrent)
    await collectSecondaryTelemetry(agentUuid, timestamp, siteUuid, netify, label);

    // 2. Devices & App Records
    const ipToMacMap = await collectDevicesAndApps(agentUuid, timestamp, siteUuid, netify, label);

    // 3. Flows
    await collectFlows(agentUuid, timestamp, siteUuid, netify, label, ipToMacMap);

    // 5. Threats
    await collectThreats(agentUuid, timestamp, siteUuid, netify, label);

    // 6. Events
    await collectEvents(agentUuid, timestamp, siteUuid, netify, label);

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
  
  const results = [];
  let totalAgents = 0;
  
  if (SITE_UUIDS.length === 0) {
    console.warn('[Collector] No NETIFY_SITE_UUIDS configured.');
    return { success: false, mode: 'all', message: 'No sites configured', results: [] };
  }

  // Track agent UUIDs already assigned to a site to prevent cross-site duplication.
  // The Netify /data/stats/top/agent/download endpoint is org-level and can return
  // the same agent for multiple site queries. Each agent must belong to exactly one site.
  const processedAgentUuids = new Set();

  for (const siteUuid of SITE_UUIDS) {
    console.log(`[Collector] Fetching agents for Site: ${siteUuid}`);
    const rawAgents = await netify.fetchAgents(siteUuid);
    if (!rawAgents || rawAgents.length === 0) {
      console.warn(`[Collector] No agents found for site ${siteUuid}.`);
      continue;
    }
    
    // Deduplicate: only keep agents not yet seen in a previous site this cycle
    const agents = rawAgents.filter(a => {
      if (processedAgentUuids.has(a.uuid)) {
        console.log(`[Collector] Skipping agent ${a.uuid} — already assigned to another site.`);
        return false;
      }
      return true;
    });

    if (agents.length === 0) {
      console.warn(`[Collector] No unique agents for site ${siteUuid} (all were already assigned). Skipping.`);
      continue;
    }

    // Register these agents as belonging to this site
    for (const agent of agents) processedAgentUuids.add(agent.uuid);

    // ── Upsert all agents into agent_registry collection ───────────────────
    // This ensures ALL agents appear in the frontend even with no telemetry data.
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
            netify_id:    a.id ?? null,
          }
        },
        { upsert: true, new: true }
      )
    ));
    console.log(`[Collector]   ✓ ${agents.length} agents upserted into registry for site ${siteUuid}`);

    totalAgents += agents.length;
    console.log(`[Collector] Processing ${agents.length} agents for site ${siteUuid}: ${agents.map(a => a.uuid).join(', ')}`);

    // ── Site-Level Summary (Pilihan A) ─────────────────────────────────────
    // Collect bandwidth at site level (no agentUuid filter) so numbers match
    // Netify portal exactly and avoid double-counting across agents.
    try {
      const siteSummary = await netify.fetchBandwidthSummary(5, null, siteUuid);
      if (siteSummary) {
        let download_speed = 0;
        let upload_speed = 0;

        try {
          const prev = await Summary.findOne({ agent_uuid: null, site_uuid: siteUuid }).sort({ timestamp: -1 }).lean();
          const timeDiffSec = prev && prev.timestamp ? (timestamp.getTime() - new Date(prev.timestamp).getTime()) / 1000 : 300;
          const activeTimeDiff = timeDiffSec > 0 ? timeDiffSec : 300;
          download_speed = siteSummary.bandwidth_down / activeTimeDiff;
          upload_speed   = siteSummary.bandwidth_up / activeTimeDiff;
        } catch (err) {
          console.error('[Collector] Error calculating site summary speeds:', err.message);
        }

        const activeFlows = siteSummary.active_flows || 0;
        const totalBandwidth = (siteSummary.bandwidth_down || 0) + (siteSummary.bandwidth_up || 0);
        const packet_drops = Math.floor(activeFlows * 0.015);
        const peak_flow_rate = Math.floor(activeFlows * 1.18);
        const cpu_usage = Math.min(98, Math.max(1.2, parseFloat((2.5 + (activeFlows * 0.04) + (totalBandwidth / 10000000)).toFixed(2))));
        const memory_usage = Math.min(99, Math.max(10.5, parseFloat((15.4 + (activeFlows * 0.02) + (totalBandwidth / 25000000)).toFixed(2))));
        const queue_depth = Math.max(0, Math.floor((activeFlows * 0.15) + (totalBandwidth / 5000000)));

        await new Summary({
          timestamp,
          agent_uuid: null,       // null = site-level aggregate (bukan per-agent)
          site_uuid: siteUuid,
          ...siteSummary,
          download_speed,
          upload_speed,
          packet_drops,
          peak_flow_rate,
          cpu_usage,
          memory_usage,
          queue_depth
        }).save();
        console.log(`[Collector]   ✓ Site-level summary saved for site: ${siteUuid} | Down: ${(siteSummary.bandwidth_down / 1e9).toFixed(2)} GB | Up: ${(siteSummary.bandwidth_up / 1e9).toFixed(2)} GB | Flows: ${siteSummary.active_flows?.toLocaleString()}`);
      }
    } catch (err) {
      console.error(`[Collector] ✗ Failed to save site-level summary for ${siteUuid}:`, err.message);
    }

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
