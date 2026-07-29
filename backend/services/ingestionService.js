const cron = require('node-cron');
const netify = require('../netify');
const { Summary, AppStat, ProtocolStat, DeviceStat, Flow, Threat } = require('../models/Schemas');

const SITE_UUID = process.env.NETIFY_SITE_UUID || process.env.BACKONE_SITE_UUID;
let isRunning = false;

async function runPoll() {
  if (isRunning) return;
  isRunning = true;
  const timestamp = new Date();
  console.log(`[Mongo-Ingestion] Started polling at ${timestamp.toISOString()}`);

  try {
    const agents = await netify.fetchAgents();
    const agentList = agents && agents.length > 0 ? agents.map(a => a.uuid) : [null]; // null for global

    for (const agentUuid of agentList) {
      console.log(`[Mongo-Ingestion] Fetching data for Agent: ${agentUuid || 'Global'}`);

      // 1. Summary
      const summary = await netify.fetchBandwidthSummary(1440, agentUuid);
      if (summary) {
        await new Summary({
          timestamp,
          agent_uuid: agentUuid,
          site_uuid: SITE_UUID,
          ...summary
        }).save();
      }

      // 2. Apps
      const apps = await netify.fetchTopApps(1440, 200, agentUuid); // high limit for data lake
      if (apps && apps.length > 0) {
        const appDocs = apps.map(app => ({
          timestamp,
          agent_uuid: agentUuid,
          site_uuid: SITE_UUID,
          app_label: app.application?.label || 'Unknown',
          download: app.download || 0,
          upload: app.upload || 0,
          flows: app.flows || 0
        }));
        await AppStat.insertMany(appDocs);
      }

      const devices = await netify.fetchDiscoveredDevices(1440, 500, agentUuid);
      if (devices && devices.length > 0) {
        const devDocs = devices.map(d => ({
          timestamp,
          agent_uuid: agentUuid,
          site_uuid: SITE_UUID,
          ip_address: d.ip_address,
          mac_address: d.mac_address,
          device_label: d.device_label,
          device_type: d.device_type,
          os_label: d.os_label,
          manufacturer: d.manufacturer,
          download: d.download || 0,
          upload: d.upload || 0,
          flows: d.flows || 0,
          last_seen: d.last_seen
        })).filter(d => d.ip_address); // Ensure ip_address exists to avoid validation error
        if (devDocs.length > 0) {
          await DeviceStat.insertMany(devDocs);
        }
      }
      
      // 4. Flows
      const flows = await netify.fetchFlows(500, agentUuid);
      if (flows && flows.length > 0) {
        const flowDocs = flows.map(f => ({
          timestamp,
          agent_uuid: agentUuid,
          site_uuid: SITE_UUID,
          flow_id: f.flow_id,
          src_ip: f.src_ip,
          src_mac: f.src_mac,
          dst_ip: f.dst_ip,
          dst_port: f.dst_port,
          protocol: f.protocol,
          app_label: f.app_label,
          domain: f.domain,
          download: f.download || 0,
          upload: f.upload || 0,
          first_seen: f.first_seen,
          last_seen: f.last_seen
        })).filter(f => f.src_ip);
        if (flowDocs.length > 0) {
          await Flow.insertMany(flowDocs);
        }
      }

      // 5. Threats
      const threats = await netify.fetchCyberThreats(agentUuid);
      if (threats && threats.length > 0) {
        const threatDocs = threats.map(t => ({
          timestamp,
          agent_uuid: agentUuid,
          site_uuid: SITE_UUID,
          threat_type: t.threat_type || 'Unknown Threat',
          severity: t.severity || 'Medium',
          src_ip: t.src_ip,
          dst_ip: t.dst_ip,
          dst_port: t.dst_port,
          protocol: t.protocol,
          description: t.description,
          event_at: t.event_at || new Date().toISOString()
        }));
        if (threatDocs.length > 0) {
          await Threat.insertMany(threatDocs);
        }
      }
    }
  } catch (error) {
    console.error('[Mongo-Ingestion] Error during polling:', error);
  } finally {
    isRunning = false;
  }
}

function startScheduler() {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    runPoll();
  });
  console.log('[Mongo-Ingestion] Scheduler started (every 5 minutes)');
  
  // Initial run
  runPoll();
}

module.exports = { startScheduler };


