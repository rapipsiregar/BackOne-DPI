// proxy/collectorHelperDpi2.js
// ─────────────────────────────────────────────────────────────────────────────
// Supplementary Telemetry collection steps for devices, flows, threats, and events.
// Split from collector.js to satisfy the 256-line file size limit.
// ─────────────────────────────────────────────────────────────────────────────

const { DeviceStat, DeviceAppStat, Flow, Threat, Event } = require('./models/Schemas');
const {
  generateMacFromIp,
  resolveVendorFromIp,
  resolveDeviceTypeFromIp,
  resolveOSFromIp,
  generateAutoLabel
} = require('./deviceResolver');

async function collectDevicesAndApps(agentUuid, timestamp, SITE_UUID, netify, label) {
  const devices = await netify.fetchDiscoveredDevices(1440, 500, agentUuid);
  const ipToMacMap = {};
  
  if (devices && devices.length > 0) {
    const devDocs = devices.map(d => {
      const ip = d.ip_address;
      const mac = d.mac_address && d.mac_address !== '-' && d.mac_address !== 'Unknown' ? d.mac_address : generateMacFromIp(ip);
      const manufacturer = d.manufacturer && d.manufacturer !== '-' && d.manufacturer !== 'Unknown' ? d.manufacturer : resolveVendorFromIp(ip);
      const device_type = d.device_type && d.device_type !== '-' && d.device_type !== 'Unknown' ? d.device_type : resolveDeviceTypeFromIp(ip);
      const os_label = d.os_label && d.os_label !== '-' && d.os_label !== 'Unknown' ? d.os_label : resolveOSFromIp(ip);
      const device_label = d.device_label && d.device_label !== '-' && d.device_label !== ip ? d.device_label : generateAutoLabel(ip, mac, manufacturer, device_type);

      if (ip && mac) ipToMacMap[ip] = mac;

      return {
        timestamp, agent_uuid: agentUuid, site_uuid: SITE_UUID,
        ip_address: ip, mac_address: mac,
        device_label, device_type,
        os_label, manufacturer,
        download: d.download || 0, upload: d.upload || 0, flows: d.flows || 0,
        last_seen: d.last_seen,
      };
    }).filter(d => d.ip_address);

    if (devDocs.length > 0) {
      const devOps = devDocs.map(d => ({
        updateOne: {
          filter: { agent_uuid: d.agent_uuid, ip_address: d.ip_address },
          update: { $set: d },
          upsert: true,
        },
      }));
      await DeviceStat.bulkWrite(devOps, { ordered: false });
      console.log(`[Collector]   ✓ ${devDocs.length} devices upserted for ${label}`);

      // Fetch per-device apps for top 30 devices
      const topDevices = devDocs.filter(d => d.ip_address && d.download > 0)
        .sort((a, b) => b.download - a.download).slice(0, 30);

      let deviceAppCount = 0;
      for (let i = 0; i < topDevices.length; i += 5) {
        const batch = topDevices.slice(i, i + 5);
        const results = await Promise.allSettled(batch.map(d => netify.fetchDeviceApps(d.ip_address, 1440, 50, agentUuid)));
        const appDocs = [];
        results.forEach((res, idx) => {
          if (res.status === 'fulfilled' && Array.isArray(res.value)) {
            const ip = batch[idx].ip_address;
            res.value.forEach(app => appDocs.push({
              timestamp, agent_uuid: agentUuid, site_uuid: SITE_UUID, ip_address: ip,
              app_label: app.app_label, app_id: app.app_id,
              download: app.download || 0, upload: app.upload || 0, flows: app.flows || 0,
            }));
          }
        });
        if (appDocs.length > 0) {
          await DeviceAppStat.insertMany(appDocs);
          deviceAppCount += appDocs.length;
        }
        if (i + 5 < topDevices.length) await new Promise(r => setTimeout(r, 500));
      }
      if (deviceAppCount > 0) console.log(`[Collector]   ✓ ${deviceAppCount} device-app records saved for ${label}`);
    }
  }
  return ipToMacMap;
}

async function collectFlows(agentUuid, timestamp, SITE_UUID, netify, label, ipToMacMap) {
  const flowLimit = parseInt(process.env.PROXY_FLOW_LIMIT || '10000');
  const flows = await netify.fetchFlows(flowLimit, agentUuid);
  if (flows && flows.length > 0) {
    const flowDocs = flows.map(f => {
      const mac = f.src_mac || ipToMacMap[f.src_ip] || generateMacFromIp(f.src_ip);
      return {
        timestamp, agent_uuid: agentUuid, site_uuid: SITE_UUID,
        flow_id: f.flow_id, src_ip: f.src_ip, src_mac: mac,
        dst_ip: f.dst_ip, dst_port: f.dst_port, protocol: f.protocol,
        app_label: f.app_label, domain: f.domain,
        download: f.download || 0, upload: f.upload || 0,
        first_seen: f.first_seen, last_seen: f.last_seen,
      };
    }).filter(f => f.src_ip);
    if (flowDocs.length > 0) {
      const operations = flowDocs.map(f => ({
        updateOne: {
          filter: { flow_id: f.flow_id, agent_uuid: f.agent_uuid },
          update: { $set: f },
          upsert: true
        }
      }));
      await Flow.bulkWrite(operations);
      console.log(`[Collector]   ✓ ${flowDocs.length} flows upserted for ${label}`);

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const pruned = await Flow.deleteMany({ agent_uuid: agentUuid, timestamp: { $lt: oneHourAgo } });
      if (pruned.deletedCount > 0) {
        console.log(`[Collector]   ✓ Pruned ${pruned.deletedCount} inactive flows for ${label}`);
      }
    }
  }
}

async function collectThreats(agentUuid, timestamp, SITE_UUID, netify, label) {
  const threats = await netify.fetchCyberThreats(agentUuid);
  if (threats && threats.length > 0) {
    const threatDocs = threats.map(t => ({
      timestamp, agent_uuid: agentUuid, site_uuid: SITE_UUID,
      threat_type: t.threat_type || 'Unknown Threat', severity: t.severity || 'Medium',
      src_ip: t.src_ip, dst_ip: t.dst_ip, dst_port: t.dst_port, protocol: t.protocol,
      description: t.description, event_at: t.event_at || new Date().toISOString(),
    }));
    await Threat.insertMany(threatDocs);
    console.log(`[Collector]   ✓ ${threatDocs.length} threats saved for ${label}`);
  }
}

async function collectEvents(agentUuid, timestamp, SITE_UUID, netify, label) {
  const events = await netify.fetchEvents(100, agentUuid);
  if (events && events.length > 0) {
    const eventIds = events.map(e => e.event_id).filter(id => id !== null);
    const existing = await Event.find({ site_uuid: SITE_UUID, event_id: { $in: eventIds } }).distinct('event_id');
    const existingSet = new Set(existing);

    const macToAgentMap = {};
    const eventMacs = [...new Set(events.map(e => e.mac_address).filter(Boolean))];
    if (eventMacs.length > 0) {
      const storedDevices = await DeviceStat.find(
        { site_uuid: SITE_UUID, mac_address: { $in: eventMacs } },
        { mac_address: 1, agent_uuid: 1 }
      ).lean();
      for (const d of storedDevices) {
        if (d.mac_address && d.agent_uuid) macToAgentMap[d.mac_address] = d.agent_uuid;
      }
    }

    const eventDocs = events.filter(e => e.event_id === null || !existingSet.has(e.event_id)).map(e => {
      const resolvedAgentUuid = (e.mac_address && macToAgentMap[e.mac_address]) || agentUuid;
      return {
        timestamp, agent_uuid: resolvedAgentUuid, site_uuid: SITE_UUID,
        event_id: e.event_id, event_type: e.event_type, severity: e.severity,
        description: e.description, category_label: e.category_label,
        ip_address: e.ip_address, mac_address: e.mac_address, event_at: e.event_at,
      };
    });
    if (eventDocs.length > 0) {
      await Event.insertMany(eventDocs);
      console.log(`[Collector]   ✓ ${eventDocs.length} new events saved for ${label}`);
    }
  }
}

module.exports = {
  collectDevicesAndApps,
  collectFlows,
  collectThreats,
  collectEvents
};
