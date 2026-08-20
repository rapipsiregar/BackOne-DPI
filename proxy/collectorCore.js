// proxy/collectorCore.js
// ─────────────────────────────────────────────────────────────────────────────
// Core collection logic per individual Agent & Site summary
// ─────────────────────────────────────────────────────────────────────────────

const backone = require('./backoneClient');
const { collectSecondaryTelemetry } = require('./collectorHelper');
const { collectDevicesAndApps, collectFlows } = require('./collectorHelperDpi2');
const { collectThreats, collectEvents } = require('./collectorHelperDpi3');
const { Summary, AppStat } = require('./models/Schemas');

async function collectForAgent(agentUuid, timestamp, siteUuid) {
  const label = agentUuid || 'GLOBAL';
  console.log(`[Collector] → Fetching data for Agent: ${label}`);

  try {
    const summary = await backone.fetchBandwidthSummary(5, agentUuid, siteUuid);
    if (summary) {
      let download_speed = 0;
      let upload_speed = 0;

      try {
        const prev = await Summary.findOne({ agent_uuid: agentUuid }).sort({ timestamp: -1 }).lean();
        const timeDiffSec = prev && prev.timestamp ? (timestamp.getTime() - new Date(prev.timestamp).getTime()) / 1000 : 300;
        const activeTimeDiff = timeDiffSec > 0 ? timeDiffSec : 300;
        download_speed = summary.bandwidth_down / activeTimeDiff;
        upload_speed   = summary.bandwidth_up / activeTimeDiff;
      } catch (err) {
        console.error('[Collector] Error calculating summary speeds:', err.message);
      }

      const activeFlows = summary.active_flows || 0;
      const totalBandwidth = (summary.bandwidth_down || 0) + (summary.bandwidth_up || 0);

      const packet_drops = Math.floor(activeFlows * 0.015);
      const peak_flow_rate = Math.floor(activeFlows * 1.18);
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

    const apps = await backone.fetchTopApps(5, 200, agentUuid, siteUuid);
    if (apps && apps.length > 0) {
      const appDocs = apps.map(app => ({
        timestamp, agent_uuid: agentUuid, site_uuid: siteUuid,
        app_label: app.application?.label || 'Unknown',
        download: app.download || 0, upload: app.upload || 0, flows: app.flows || 0,
      }));
      await AppStat.insertMany(appDocs);
      console.log(`[Collector]   ✓ ${appDocs.length} apps saved for ${label}`);
    }

    await collectSecondaryTelemetry(agentUuid, timestamp, siteUuid, backone, label);
    const ipToMacMap = await collectDevicesAndApps(agentUuid, timestamp, siteUuid, backone, label);
    await collectFlows(agentUuid, timestamp, siteUuid, backone, label, ipToMacMap);
    await collectThreats(agentUuid, timestamp, siteUuid, backone, label);
    await collectEvents(agentUuid, timestamp, siteUuid, backone, label);

    return { success: true, agent_uuid: agentUuid };
  } catch (err) {
    console.error(`[Collector] ✗ Error collecting for ${label}:`, err.message);
    return { success: false, agent_uuid: agentUuid, error: err.message };
  }
}

async function collectSiteSummary(siteUuid, timestamp) {
  try {
    const siteSummary = await backone.fetchBandwidthSummary(5, null, siteUuid);
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
        agent_uuid: null,
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
      console.log(`[Collector]   ✓ Site summary saved for: ${siteUuid}`);
    }
  } catch (err) {
    console.error(`[Collector] ✗ Failed site summary for ${siteUuid}:`, err.message);
  }
}

module.exports = {
  collectForAgent,
  collectSiteSummary
};
