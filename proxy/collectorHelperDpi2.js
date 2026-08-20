// proxy/collectorHelperDpi2.js
// ─────────────────────────────────────────────────────────────────────────────
// Supplementary Telemetry collection steps for devices, flows, threats, and events.
// Split from collector.js to satisfy the 256-line file size limit.
// ─────────────────────────────────────────────────────────────────────────────

const { DeviceStat, DeviceAppStat, Flow, Threat, Event, BlacklistRule, LookupApp } = require('./models/Schemas');
const {
  generateMacFromIp,
  resolveVendorFromIp,
  resolveDeviceTypeFromIp,
  resolveOSFromIp,
  generateAutoLabel
} = require('./deviceResolver');

async function collectDevicesAndApps(agentUuid, timestamp, SITE_UUID, backone, label) {
  const devices = await backone.fetchDiscoveredDevices(5, 500, agentUuid, SITE_UUID);
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
        const results = await Promise.allSettled(batch.map(d => backone.fetchDeviceApps(d.ip_address, 5, 50, agentUuid, SITE_UUID)));
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

async function collectFlows(agentUuid, timestamp, SITE_UUID, backone, label, ipToMacMap) {
  // BackOne API has a limit of 1,000,000 for settings_limit. Use 1000000 as default per rule.
  const flowLimit = parseInt(process.env.PROXY_FLOW_LIMIT || '1000000');
  // Fetch flows dari 24 jam terakhir (1440 menit) agar semua flow — termasuk yang sudah selesai —
  // tersimpan ke MongoDB, bukan hanya koneksi yang aktif saat ini.
  const FLOW_INTERVAL_MINUTES = 1440;
  const flows = await backone.fetchFlows(flowLimit, agentUuid, SITE_UUID, FLOW_INTERVAL_MINUTES);
  if (flows && flows.length > 0) {
    const flowDocs = flows.map(f => {
      const mac = f.src_mac || ipToMacMap[f.src_ip] || generateMacFromIp(f.src_ip);
      return {
        timestamp, agent_uuid: agentUuid, site_uuid: SITE_UUID,
        flow_id: f.flow_id, src_ip: f.src_ip, src_mac: mac,
        dst_ip: f.dst_ip, dst_port: f.dst_port, protocol: f.protocol,
        app_label: f.app_label, domain: f.domain,
        sni_hostname: f.tls?.sni || f.tls_sni || f.metadata?.tls_sni || (f.tls_server_name_indication || ''),
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

      // Blacklist Detection
      try {
        const blacklistRules = await BlacklistRule.find({ site_uuid: SITE_UUID, agent_uuid: agentUuid, is_active: true }).lean();
        if (blacklistRules.length > 0) {
          const blacklistedCategories = new Set(blacklistRules.filter(r => r.type === 'category').map(r => r.value.toLowerCase()));
          const blacklistedDomains = new Set(blacklistRules.filter(r => r.type === 'domain').map(r => r.value.toLowerCase()));

          const flowIdsInBatch = flowDocs.map(f => f.flow_id).filter(Boolean);
          const existingFlowThreats = new Set(
            await Threat.find({ flow_id: { $in: flowIdsInBatch } }).distinct('flow_id')
          );

          const threatDocs = [];
          const eventDocs = [];

          for (const f of flowDocs) {
            let isViolation = false;
            let categoryLabel = "";

            // Check if domain is blacklisted
            for (const r of blacklistRules) {
              if (r.type === 'domain') {
                const val = r.value.toLowerCase();
                // Direct domain match
                if (f.domain && f.domain.toLowerCase().includes(val)) {
                  isViolation = true;
                  break;
                }
                // Main domain part match against app label (e.g. "google" from "google.com")
                const mainDomainPart = val.split('.')[0];
                if (mainDomainPart && f.app_label && f.app_label.toLowerCase().includes(mainDomainPart)) {
                  isViolation = true;
                  break;
                }
              }
            }

            // Look up app details to check category
            if (!isViolation && f.app_label) {
              const appDef = await LookupApp.findOne({ label: f.app_label }).lean();
              if (appDef && appDef.application_category?.label) {
                categoryLabel = appDef.application_category.label;
                if (blacklistedCategories.has(categoryLabel.toLowerCase())) {
                  isViolation = true;
                }
              }
            }

            if (isViolation && !existingFlowThreats.has(f.flow_id)) {
              threatDocs.push({
                timestamp,
                agent_uuid: f.agent_uuid,
                site_uuid: f.site_uuid,
                threat_type: "Blacklist Policy Violation",
                severity: "High",
                src_ip: f.src_ip,
                dst_ip: f.dst_ip,
                dst_port: f.dst_port,
                protocol: f.protocol,
                description: `Access to blacklisted app/domain: ${f.app_label} (${f.domain || 'N/A'})${categoryLabel ? ' - Category: ' + categoryLabel : ''}`,
                event_at: new Date().toISOString(),
                flow_id: f.flow_id
              });

              eventDocs.push({
                timestamp,
                agent_uuid: f.agent_uuid,
                site_uuid: f.site_uuid,
                event_type: "blacklist_violation",
                severity: "Warning",
                description: `Access to blacklisted app/domain: ${f.app_label} (${f.domain || 'N/A'})${categoryLabel ? ' - Category: ' + categoryLabel : ''}`,
                ip_address: f.src_ip,
                mac_address: f.src_mac,
                event_at: new Date(),
                flow_id: f.flow_id
              });
            }
          }

          if (threatDocs.length > 0) {
            await Threat.insertMany(threatDocs);
            console.log(`[Collector]   ✓ ${threatDocs.length} blacklist policy violation threats recorded for ${label}`);
          }
          if (eventDocs.length > 0) {
            await Event.insertMany(eventDocs);
            console.log(`[Collector]   ✓ ${eventDocs.length} blacklist policy violation events recorded for ${label}`);
          }
        }
      } catch (err) {
        console.error('[Collector] Blacklist detection failed:', err.message);
      }

      // Removed 1-hour pruning to comply with Rule 19 (7-day global retention)
    }
  }
}

module.exports = {
  collectDevicesAndApps,
  collectFlows
};
