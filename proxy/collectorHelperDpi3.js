// proxy/collectorHelperDpi3.js
// ─────────────────────────────────────────────────────────────────────────────
// Supplementary Telemetry collection steps for threats and events.
// Split from collectorHelperDpi2.js to satisfy the 256-line file size limit.
// ─────────────────────────────────────────────────────────────────────────────

const { DeviceStat, Threat, Event } = require('./models/Schemas');

async function collectThreats(agentUuid, timestamp, SITE_UUID, backone, label) {
  const threats = await backone.fetchCyberThreats(agentUuid, SITE_UUID);
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

async function collectEvents(agentUuid, timestamp, SITE_UUID, backone, label) {
  const events = await backone.fetchEvents(100, agentUuid, SITE_UUID);
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
  collectThreats,
  collectEvents
};
