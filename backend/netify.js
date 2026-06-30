// backend/netify.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const axios = require('axios');

const BASE_URL  = 'https://informatics.netify.ai/api/v1';
const JWT_TOKEN = process.env.NETIFY_JWT_TOKEN;
const SITE_UUID = process.env.NETIFY_SITE_UUID;

function headersSite(useApiKey = false) {
  const token = useApiKey ? process.env.NETIFY_API_KEY : JWT_TOKEN;
  const headers = { 'x-api-key': token, 'Accept': 'application/json' };
  if (!useApiKey) {
    headers['x-net-site'] = SITE_UUID;
  }
  return headers;
}

async function netifyFetch(path, params = {}, useApiKey = false) {
  try {
    const res = await axios.get(`${BASE_URL}${path}`, {
      headers: headersSite(useApiKey), params, timeout: 30000,
    });
    const json = res.data;
    if (json?.status_code !== 0) {
      console.error(`[Netify] API Error ${json?.status_code} pada ${path}: ${json?.status_message}`);
      return null;
    }
    return json?.data ?? null;
  } catch (err) {
    const s = err.response?.status;
    const msg = JSON.stringify(err.response?.data ?? err.message);
    console.error(`[Netify] ${s ?? 'ERR'} ${path}: ${msg}`);
    return null;
  }
}

// ─── TOP APPS: download + upload digabung ─────────────────────────────────────
async function fetchTopApps(interval = 1440, limit = 20) {
  const [dlData, ulData] = await Promise.all([
    netifyFetch('/data/stats/top/application/download', { filter_interval: interval, settings_limit: limit }),
    netifyFetch('/data/stats/top/application/upload',   { filter_interval: interval, settings_limit: limit }),
  ]);
  if (!dlData) return null;

  // Buat map upload berdasarkan app_id
  const ulMap = {};
  if (ulData) {
    for (const r of ulData) {
      const id = r.application?.id;
      if (id) ulMap[id] = r.upload ?? 0;
    }
  }

  return dlData.map(r => ({
    app_id    : r.application?.id ?? null,
    app_label : r.application?.label ?? 'Unknown',
    app_tag   : r.application?.tag ?? null,
    category  : r.application?.category?.label ?? null,
    favicon   : r.application?.favicon ?? null,
    download  : r.download ?? 0,
    upload    : ulMap[r.application?.id] ?? 0,
    total     : (r.download ?? 0) + (ulMap[r.application?.id] ?? 0),
    flows     : r.flows ?? 0,
  }));
}

// ─── TOP DEVICES: download + upload digabung ──────────────────────────────────
async function fetchTopDevices(interval = 1440, limit = 50) {
  const [dlData, ulData] = await Promise.all([
    netifyFetch('/data/stats/top/local_ip/download', { filter_interval: interval, settings_limit: limit }),
    netifyFetch('/data/stats/top/local_ip/upload',   { filter_interval: interval, settings_limit: limit }),
  ]);
  if (!dlData) return null;

  // Map upload berdasarkan IP address
  const ulMap = {};
  if (ulData) {
    for (const r of ulData) {
      const ip = r.local_ip?.address ?? String(r.local_ip);
      ulMap[ip] = r.upload ?? 0;
    }
  }

  return dlData.map(r => {
    const ip = r.local_ip?.address ?? String(r.local_ip ?? '');
    return {
      ip_address   : ip,
      mac_address  : null,
      device_label : ip,
      device_type  : null,
      os_label     : null,
      manufacturer : null,
      download     : r.download ?? 0,
      upload       : ulMap[ip] ?? 0,
      last_seen    : null,
    };
  });
}

// ─── FLOWS: endpoint /data/flows yang sudah confirmed ada ────────────────────
async function fetchFlows(limit = 500) {
  const raw = await netifyFetch('/data/flows', { settings_limit: limit });
  if (!raw || !Array.isArray(raw)) return null;

  return raw.map(r => ({
    flow_id    : String(r.flow_id ?? ''),
    src_ip     : r.local_ip?.address  ?? null,
    src_mac    : r.local_mac          ?? r.mac?.address ?? null,
    dst_ip     : r.remote_ip?.address ?? null,
    dst_port   : r.remote_port        ?? null,
    protocol   : r.ip_protocol?.label ?? null,
    app_label  : null,   // tidak tersedia di API flows
    domain     : null,   // tidak tersedia di API flows
    download   : r.download ?? 0,
    upload     : r.upload   ?? 0,
    first_seen : r.first_seen_at?.date ?? null,
    last_seen  : r.last_seen_at?.date  ?? null,
  }));
}

// ─── PROTOCOLS ────────────────────────────────────────────────────────────────
async function fetchTopProtocols(interval = 1440, limit = 20) {
  const [dlData, ulData] = await Promise.all([
    netifyFetch('/data/stats/top/protocol/download', { filter_interval: interval, settings_limit: limit }),
    netifyFetch('/data/stats/top/protocol/upload',   { filter_interval: interval, settings_limit: limit }),
  ]);
  if (!dlData) return null;

  const ulMap = {};
  if (ulData) {
    for (const r of ulData) {
      const id = r.protocol?.id;
      if (id) ulMap[id] = r.upload ?? 0;
    }
  }

  return dlData.map(r => ({
    protocol_id    : r.protocol?.id ?? null,
    protocol_label : r.protocol?.label ?? 'Unknown',
    download       : r.download ?? 0,
    upload         : ulMap[r.protocol?.id] ?? 0,
    flows          : r.flows ?? 0,
  }));
}

// ─── COUNTRIES ────────────────────────────────────────────────────────────────
async function fetchTopCountries(interval = 1440, limit = 15) {
  const [dlData, ulData] = await Promise.all([
    netifyFetch('/data/stats/top/country/download', { filter_interval: interval, settings_limit: limit }),
    netifyFetch('/data/stats/top/country/upload',   { filter_interval: interval, settings_limit: limit }),
  ]);
  if (!dlData) return null;

  const ulMap = {};
  if (ulData) {
    for (const r of ulData) {
      const code = r.country?.code;
      if (code) ulMap[code] = r.upload ?? 0;
    }
  }

  return dlData.map(r => ({
    country_code : r.country?.code ?? null,
    country_name : r.country?.label ?? 'Unknown',
    download     : r.download ?? 0,
    upload       : ulMap[r.country?.code] ?? 0,
    flows        : r.flows ?? 0,
  }));
}

// ─── DNS/HOSTNAME ─────────────────────────────────────────────────────────────
async function fetchTopDomains(interval = 1440, limit = 20) {
  const raw = await netifyFetch('/data/stats/top/hostname/download', {
    filter_interval: interval, settings_limit: limit,
  });
  if (!raw) return null;

  return raw.map(r => ({
    domain      : r.hostname?.name ?? null,
    app_label   : r.hostname?.application_name ?? null,
    category    : r.hostname?.application_category_label ?? null,
    download    : r.download ?? 0,
    query_count : r.flows ?? r.download ?? 0,
  }));
}

// ─── BANDWIDTH SUMMARY untuk timeline ─────────────────────────────────────────
async function fetchBandwidthSummary(interval = 30) {
  // Pakai interval PENDEK (30 menit) untuk timeline supaya ada variasi naik turun
  const [dlData, ulData] = await Promise.all([
    netifyFetch('/data/stats/top/application/download', { filter_interval: interval, settings_limit: 100 }),
    netifyFetch('/data/stats/top/application/upload',   { filter_interval: interval, settings_limit: 100 }),
  ]);

  const download = (dlData ?? []).reduce((s, r) => s + (r.download ?? 0), 0);
  const upload   = (ulData ?? []).reduce((s, r) => s + (r.upload   ?? 0), 0);
  const flows    = (dlData ?? []).reduce((s, r) => s + (r.flows    ?? 0), 0);

  return { download, upload, flows, devices: dlData?.length ?? 0 };
}

// ─── THREATS — gunakan flows dengan filter anomali sebagai fallback ────────────
async function fetchCyberThreats(limit = 50) {
  // Events/threats belum ada di v1 — return array kosong agar tidak error
  // Akan diisi saat endpoint ditemukan
  return [];
}

// ─── EVENTS ───────────────────────────────────────────────────────────────────
async function fetchEvents(limit = 50) {
  const raw = await netifyFetch('/event/events', { settings_limit: limit });
  if (!raw || !Array.isArray(raw)) return [];

  return raw.map(r => {
    let msg = r.label || '';
    if (r.description) {
      try {
        const descObj = JSON.parse(r.description);
        msg = descObj.default || r.label || '';
        if (descObj.tags) {
          for (const k in descObj.tags) {
            const val = Array.isArray(descObj.tags[k]) ? descObj.tags[k][0] : descObj.tags[k];
            msg = msg.replace(`{{ ${k} }}`, val).replace(`{{${k}}}`, val);
          }
        }
      } catch (e) {
        msg = r.description;
      }
    }

    let sevLabel = 'Info';
    if (r.severity >= 30) sevLabel = 'Critical';
    else if (r.severity >= 20) sevLabel = 'High';
    else if (r.severity >= 10) sevLabel = 'Warning';

    let srcIp = null;
    if (r.description) {
      try {
        const descObj = JSON.parse(r.description);
        srcIp = descObj.tags?.device_ip || descObj.tags?.ip || null;
      } catch {}
    }

    return {
      event_id: r.id || null,
      event_type: r.basename || 'unknown',
      severity: sevLabel,
      mac_address: r.additional?.device?.mac?.address || null,
      ip_address: srcIp,
      description: msg,
      event_at: r.created_at?.date || new Date().toISOString()
    };
  });
}

async function fetchDiscoveredDevices(interval = 1440, limit = 500) {
  const [intelRaw, dlData, ulData] = await Promise.all([
    netifyFetch('/intelligence/discovery/devices', { settings_limit: limit }),
    netifyFetch('/data/stats/top/local_ip/download', { filter_interval: interval, settings_limit: limit }),
    netifyFetch('/data/stats/top/local_ip/upload',   { filter_interval: interval, settings_limit: limit }),
  ]);

  if (!intelRaw || !Array.isArray(intelRaw)) return [];

  // Map bandwidth per IP
  const dlMap = {};
  const ulMap = {};
  if (dlData) {
    for (const r of dlData) {
      const ip = r.local_ip?.address ?? String(r.local_ip);
      dlMap[ip] = r.download ?? 0;
    }
  }
  if (ulData) {
    for (const r of ulData) {
      const ip = r.local_ip?.address ?? String(r.local_ip);
      ulMap[ip] = r.upload ?? 0;
    }
  }

  return intelRaw.map(r => {
    const ip = r.ip?.address ?? null;
    const mac = r.mac_address ?? r.discovery_mac?.address ?? null;
    const oui = mac ? mac.substring(0, 8).toUpperCase() : null;
    const mfr = r.mac_vendor !== 'Unknown' && r.mac_vendor !== 'Local' ? r.mac_vendor : (OUI_MAP[oui] ?? r.mac_vendor ?? null);

    return {
      ip_address   : ip,
      mac_address  : mac,
      device_label : r.device?.label || r.discovery_mac?.discovery_hardware || ip || 'Unknown',
      device_type  : r.discovery_type?.label || null,
      os_label     : r.discovery_os?.label || null,
      manufacturer : mfr,
      download     : ip ? (dlMap[ip] ?? 0) : 0,
      upload       : ip ? (ulMap[ip] ?? 0) : 0,
      last_seen    : r.last_seen_at?.date || r.discovery_mac?.last_seen_at?.date || null,
    };
  }).sort((a, b) => b.download - a.download);
}

// OUI lookup — manufacturer dari 3 oktet pertama MAC
const OUI_MAP = {
  '60:BE:B4' : 'Ruckus Networks',
  '74:6F:88' : 'Ruckus Networks',
  '04:F4:1C' : 'MikroTik',
  'F4:6D:3F' : 'TP-Link',
  'B8:27:EB' : 'Raspberry Pi',
  'DC:A6:32' : 'Raspberry Pi',
  'E4:5F:01' : 'Raspberry Pi',
  '00:50:56' : 'VMware',
  '08:00:27' : 'VirtualBox',
  'AC:17:02' : 'ASUSTek',
  'B4:2E:99' : 'ASUSTek',
  '18:31:BF' : 'ASUSTek',
  '74:D0:2B' : 'Cisco',
  'F8:72:EA' : 'Cisco',
  '00:1A:A0' : 'Cisco',
  'FC:FB:FB' : 'Cisco Meraki',
  '88:15:44' : 'Cisco Meraki',
  '00:18:0A' : 'Ubiquiti',
  '04:18:D6' : 'Ubiquiti',
  '24:A4:3C' : 'Ubiquiti',
  '78:8A:20' : 'Ubiquiti',
  'DC:9F:DB' : 'Ubiquiti',
  '80:2A:A8' : 'Ubiquiti',
  'FC:EC:DA' : 'Ubiquiti',
  '00:27:22' : 'Ubiquiti',
  'B4:FB:E4' : 'Samsung',
  '8C:79:F0' : 'Samsung',
  'F0:25:B7' : 'Samsung',
  '78:BD:BC' : 'Samsung',
  '3C:28:6D' : 'Apple',
  'A4:C3:F0' : 'Apple',
  'F8:FF:C2' : 'Apple',
  '98:01:A7' : 'Apple',
  '3C:22:FB' : 'Apple',
  'F0:DB:F8' : 'Huawei',
  '00:E0:FC' : 'Huawei',
  '54:89:98' : 'Huawei',
  '28:31:52' : 'Xiaomi',
  '64:09:80' : 'Xiaomi',
  'AC:C1:EE' : 'Xiaomi',
  '50:64:2B' : 'Xiaomi',
  '00:0C:29' : 'VMware',
  '00:15:5D' : 'Microsoft Hyper-V',
  '52:54:00' : 'QEMU/KVM',
};

// ─── TAMBAHAN FITUR 1-11 ──────────────────────────────────────────────────────

// 1. Top Application Category
async function fetchTopAppCategories(interval = 1440, limit = 15) {
  const [dlData, ulData] = await Promise.all([
    netifyFetch('/data/stats/top/application_category/download', { filter_interval: interval, settings_limit: limit }),
    netifyFetch('/data/stats/top/application_category/upload',   { filter_interval: interval, settings_limit: limit }),
  ]);
  if (!dlData) return null;
  const ulMap = {};
  if (ulData) for (const r of ulData) {
    const key = r.application_category?.label ?? r.application_category;
    if (key) ulMap[key] = r.upload ?? 0;
  }
  return dlData.map(r => {
    const label = r.application_category?.label ?? String(r.application_category ?? 'Unknown');
    return {
      category_label : label,
      download       : r.download ?? 0,
      upload         : ulMap[label] ?? 0,
      total          : (r.download ?? 0) + (ulMap[label] ?? 0),
    };
  });
}

// 2. Top Continent
async function fetchTopContinents(interval = 1440, limit = 10) {
  const [dlData, ulData] = await Promise.all([
    netifyFetch('/data/stats/top/continent/download', { filter_interval: interval, settings_limit: limit }),
    netifyFetch('/data/stats/top/continent/upload',   { filter_interval: interval, settings_limit: limit }),
  ]);
  if (!dlData) return null;
  const ulMap = {};
  if (ulData) for (const r of ulData) {
    const key = r.continent?.label ?? String(r.continent ?? '');
    if (key) ulMap[key] = r.upload ?? 0;
  }
  return dlData.map(r => {
    const label = r.continent?.label ?? String(r.continent ?? 'Unknown');
    return {
      continent_name : label,
      download       : r.download ?? 0,
      upload         : ulMap[label] ?? 0,
      total          : (r.download ?? 0) + (ulMap[label] ?? 0),
    };
  });
}

// 3. Top Region
async function fetchTopRegions(interval = 1440, limit = 20) {
  const raw = await netifyFetch('/data/stats/top/region/download', {
    filter_interval: interval, settings_limit: limit,
  });
  if (!raw) return null;
  return raw.map(r => ({
    region_name  : r.region?.region_name?.trim() || '(Unknown Region)',
    region_code  : r.region?.region_code?.trim() || null,
    country_name : r.region?.country_name ?? null,
    country_code : r.region?.country_code ?? null,
    download     : r.download ?? 0,
  }));
}

// 4. Top City
async function fetchTopCities(interval = 1440, limit = 20) {
  const raw = await netifyFetch('/data/stats/top/city/download', {
    filter_interval: interval, settings_limit: limit,
  });
  if (!raw) return null;
  return raw.map(r => ({
    city_name    : r.city?.city?.trim() || '(Unknown City)',
    region_name  : r.city?.region_name?.trim() || null,
    country_name : r.city?.country_name ?? null,
    country_code : r.city?.country_code ?? null,
    download     : r.download ?? 0,
  }));
}

// 5. Top VLAN
async function fetchTopVLANs(interval = 1440, limit = 20) {
  const [dlData, ulData] = await Promise.all([
    netifyFetch('/data/stats/top/vlan/download', { filter_interval: interval, settings_limit: limit }),
    netifyFetch('/data/stats/top/vlan/upload',   { filter_interval: interval, settings_limit: limit }),
  ]);
  if (!dlData) return null;
  const ulMap = {};
  if (ulData) for (const r of ulData) {
    const key = r.vlan?.id ?? 0;
    ulMap[key] = r.upload ?? 0;
  }
  return dlData.map(r => ({
    vlan_id    : r.vlan?.id    ?? 0,
    vlan_label : r.vlan?.label ?? `VLAN ${r.vlan?.id ?? 0}`,
    download   : r.download ?? 0,
    upload     : ulMap[r.vlan?.id ?? 0] ?? 0,
    total      : (r.download ?? 0) + (ulMap[r.vlan?.id ?? 0] ?? 0),
  }));
}

// 6. Top Interface
async function fetchTopInterfaces(interval = 1440, limit = 20) {
  const [dlData, ulData] = await Promise.all([
    netifyFetch('/data/stats/top/interface/download', { filter_interval: interval, settings_limit: limit }),
    netifyFetch('/data/stats/top/interface/upload',   { filter_interval: interval, settings_limit: limit }),
  ]);
  if (!dlData) return null;
  const ulMap = {};
  if (ulData) for (const r of ulData) {
    const key = r.interface?.id;
    if (key !== undefined) ulMap[key] = r.upload ?? 0;
  }
  return dlData.map(r => ({
    iface_id   : r.interface?.id    ?? null,
    iface_name : r.interface?.name  ?? 'Unknown',
    iface_role : r.interface?.role  ?? null,
    agent_id   : r.interface?.agent_id ?? null,
    download   : r.download ?? 0,
    upload     : ulMap[r.interface?.id] ?? 0,
    total      : (r.download ?? 0) + (ulMap[r.interface?.id] ?? 0),
  }));
}

// 7. Top Flow Type
async function fetchTopFlowTypes(interval = 1440, limit = 10) {
  const [dlData, ulData] = await Promise.all([
    netifyFetch('/data/stats/top/flow_type/download', { filter_interval: interval, settings_limit: limit }),
    netifyFetch('/data/stats/top/flow_type/upload',   { filter_interval: interval, settings_limit: limit }),
  ]);
  if (!dlData) return null;
  const ulMap = {};
  if (ulData) for (const r of ulData) {
    const key = r.flow_type?.label ?? String(r.flow_type ?? '');
    if (key) ulMap[key] = r.upload ?? 0;
  }
  return dlData.map(r => {
    const label = r.flow_type?.label ?? String(r.flow_type ?? 'Unknown');
    return {
      flow_type_label : label,
      download        : r.download ?? 0,
      upload          : ulMap[label] ?? 0,
      total           : (r.download ?? 0) + (ulMap[label] ?? 0),
    };
  });
}

// 8. Top Flow Origin
async function fetchTopFlowOrigins(interval = 1440, limit = 10) {
  const [dlData, ulData] = await Promise.all([
    netifyFetch('/data/stats/top/flow_origin/download', { filter_interval: interval, settings_limit: limit }),
    netifyFetch('/data/stats/top/flow_origin/upload',   { filter_interval: interval, settings_limit: limit }),
  ]);
  if (!dlData) return null;
  const ulMap = {};
  if (ulData) for (const r of ulData) {
    const key = r.flow_origin?.label ?? String(r.flow_origin ?? '');
    if (key) ulMap[key] = r.upload ?? 0;
  }
  return dlData.map(r => {
    const label = r.flow_origin?.label ?? String(r.flow_origin ?? 'Unknown');
    return {
      flow_origin_label : label,
      download          : r.download ?? 0,
      upload            : ulMap[label] ?? 0,
      total             : (r.download ?? 0) + (ulMap[label] ?? 0),
    };
  });
}

// 9. Top IP Version
async function fetchTopIPVersions(interval = 1440, limit = 5) {
  const [dlData, ulData] = await Promise.all([
    netifyFetch('/data/stats/top/ip_version/download', { filter_interval: interval, settings_limit: limit }),
    netifyFetch('/data/stats/top/ip_version/upload',   { filter_interval: interval, settings_limit: limit }),
  ]);
  if (!dlData) return null;
  const ulMap = {};
  if (ulData) for (const r of ulData) {
    const key = r.ip_version?.label ?? String(r.ip_version ?? '');
    if (key) ulMap[key] = r.upload ?? 0;
  }
  return dlData.map(r => {
    const label = r.ip_version?.label ?? String(r.ip_version ?? 'Unknown');
    return {
      ip_version_label : label,
      download         : r.download ?? 0,
      upload           : ulMap[label] ?? 0,
      total            : (r.download ?? 0) + (ulMap[label] ?? 0),
    };
  });
}

// 10. Top Remote IP
async function fetchTopRemoteIPs(interval = 1440, limit = 20) {
  const [dlData, ulData] = await Promise.all([
    netifyFetch('/data/stats/top/remote_ip/download', { filter_interval: interval, settings_limit: limit }),
    netifyFetch('/data/stats/top/remote_ip/upload',   { filter_interval: interval, settings_limit: limit }),
  ]);
  if (!dlData) return null;
  const ulMap = {};
  if (ulData) for (const r of ulData) {
    const key = r.remote_ip?.address ?? String(r.remote_ip ?? '');
    if (key) ulMap[key] = r.upload ?? 0;
  }
  return dlData.map(r => {
    const addr = r.remote_ip?.address ?? String(r.remote_ip ?? 'Unknown');
    return {
      remote_ip  : addr,
      ip_version : r.remote_ip?.version ?? null,
      download   : r.download ?? 0,
      upload     : ulMap[addr] ?? 0,
      total      : (r.download ?? 0) + (ulMap[addr] ?? 0),
    };
  });
}

// 11. Top Local MAC + Discovery OS
async function fetchTopLocalMACs(interval = 1440, limit = 50) {
  const [dlData, ulData, osData] = await Promise.all([
    netifyFetch('/data/stats/top/local_mac/download',  { filter_interval: interval, settings_limit: limit }),
    netifyFetch('/data/stats/top/local_mac/upload',    { filter_interval: interval, settings_limit: limit }),
    netifyFetch('/data/stats/top/discovery_os/download', { filter_interval: interval, settings_limit: 20 }),
  ]);
  if (!dlData) return null;
  const ulMap = {};
  if (ulData) for (const r of ulData) {
    if (r.local_mac) ulMap[r.local_mac] = r.upload ?? 0;
  }
  // OS summary untuk info panel
  const osList = (osData ?? []).map(r => ({
    os_label : r.discovery_os?.label ?? String(r.discovery_os ?? 'Unknown'),
    download : r.download ?? 0,
  }));
  return dlData.map(r => {
    const mac = r.local_mac ?? 'Unknown';
    const oui = mac.substring(0, 8).toUpperCase();
    return {
      mac_address  : mac,
      manufacturer : OUI_MAP[oui] ?? null,
      download     : r.download ?? 0,
      upload       : ulMap[mac] ?? 0,
      total        : (r.download ?? 0) + (ulMap[mac] ?? 0),
      _os_summary  : osList,  // disertakan di item pertama saja
    };
  });
}

// ─── DISCOVERY OS (standalone) ───────────────────────────────────────────────
async function fetchTopDiscoveryOS(interval = 1440, limit = 20) {
  const [dlData, ulData] = await Promise.all([
    netifyFetch('/data/stats/top/discovery_os/download', { filter_interval: interval, settings_limit: limit }),
    netifyFetch('/data/stats/top/discovery_os/upload',   { filter_interval: interval, settings_limit: limit }),
  ]);
  if (!dlData) return null;
  const ulMap = {};
  if (ulData) for (const r of ulData) {
    const key = r.discovery_os?.label ?? String(r.discovery_os ?? '');
    if (key) ulMap[key] = r.upload ?? 0;
  }
  return dlData.map(r => {
    const label = r.discovery_os?.label ?? String(r.discovery_os ?? 'Unknown');
    return {
      os_label : label,
      download : r.download ?? 0,
      upload   : ulMap[label] ?? 0,
      total    : (r.download ?? 0) + (ulMap[label] ?? 0),
    };
  });
}

// ─── DPI FIELDS ───────────────────────────────────────────────────────────────

// TLS Version
async function fetchTLSVersions(interval = 1440, limit = 10) {
  const [dlData, ulData] = await Promise.all([
    netifyFetch('/data/stats/top/tls_version/download', { filter_interval: interval, settings_limit: limit }),
    netifyFetch('/data/stats/top/tls_version/upload',   { filter_interval: interval, settings_limit: limit }),
  ]);
  if (!dlData) return null;
  const ulMap = {};
  if (ulData) for (const r of ulData) {
    const key = r.tls_version?.label ?? String(r.tls_version ?? '');
    if (key) ulMap[key] = r.upload ?? 0;
  }
  return dlData.map(r => {
    const label = r.tls_version?.label ?? String(r.tls_version ?? 'Unknown');
    return {
      tls_version : label,
      download    : r.download ?? 0,
      upload      : ulMap[label] ?? 0,
      total       : (r.download ?? 0) + (ulMap[label] ?? 0),
    };
  });
}

// TLS Cipher
async function fetchTLSCiphers(interval = 1440, limit = 15) {
  const [dlData, ulData] = await Promise.all([
    netifyFetch('/data/stats/top/tls_cipher/download', { filter_interval: interval, settings_limit: limit }),
    netifyFetch('/data/stats/top/tls_cipher/upload',   { filter_interval: interval, settings_limit: limit }),
  ]);
  if (!dlData) return null;
  const ulMap = {};
  if (ulData) for (const r of ulData) {
    const key = r.tls_cipher?.label ?? String(r.tls_cipher ?? '');
    if (key) ulMap[key] = r.upload ?? 0;
  }
  return dlData.map(r => {
    const label = r.tls_cipher?.label ?? String(r.tls_cipher ?? 'Unknown');
    return {
      tls_cipher : label,
      download   : r.download ?? 0,
      upload     : ulMap[label] ?? 0,
      total      : (r.download ?? 0) + (ulMap[label] ?? 0),
    };
  });
}

// TLS Security Level
async function fetchTLSSecurity(interval = 1440, limit = 10) {
  const [dlData, ulData] = await Promise.all([
    netifyFetch('/data/stats/top/tls_security/download', { filter_interval: interval, settings_limit: limit }),
    netifyFetch('/data/stats/top/tls_security/upload',   { filter_interval: interval, settings_limit: limit }),
  ]);
  if (!dlData) return null;
  const ulMap = {};
  if (ulData) for (const r of ulData) {
    const key = r.tls_security?.label ?? String(r.tls_security ?? '');
    if (key) ulMap[key] = r.upload ?? 0;
  }
  return dlData.map(r => {
    const label = r.tls_security?.label ?? String(r.tls_security ?? 'Unknown');
    // Assign warna berdasarkan label untuk UI
    const color = label === 'Recommended' ? 'green'
                : label === 'Secure'      ? 'blue'
                : label === 'Weak'        ? 'orange'
                : label === 'Insecure'    ? 'red'
                : 'gray';
    return {
      tls_security : label,
      color        : color,
      download     : r.download ?? 0,
      upload       : ulMap[label] ?? 0,
      total        : (r.download ?? 0) + (ulMap[label] ?? 0),
    };
  });
}

// NetBIOS Hostname (nama PC Windows)
async function fetchNetBIOSHostnames(interval = 1440, limit = 30) {
  const [dlData, ulData] = await Promise.all([
    netifyFetch('/data/stats/top/netbios_hostname/download', { filter_interval: interval, settings_limit: limit }),
    netifyFetch('/data/stats/top/netbios_hostname/upload',   { filter_interval: interval, settings_limit: limit }),
  ]);
  if (!dlData) return null;
  const ulMap = {};
  if (ulData) for (const r of ulData) {
    const key = r.netbios_hostname?.name ?? String(r.netbios_hostname ?? '');
    if (key) ulMap[key] = r.upload ?? 0;
  }
  return dlData.map(r => {
    const name = r.netbios_hostname?.name ?? String(r.netbios_hostname ?? 'Unknown');
    return {
      hostname : name,
      download : r.download ?? 0,
      upload   : ulMap[name] ?? 0,
      total    : (r.download ?? 0) + (ulMap[name] ?? 0),
    };
  });
}

async function fetchLookupApplications(page = 1, limit = 50, search = '') {
  const params = {
    settings_page: page,
    settings_limit: limit,
  };
  if (search) {
    params.filter_application = search;
  }
  try {
    const res = await axios.get(`${BASE_URL}/lookup/applications`, {
      headers: headersSite(true), params, timeout: 30000,
    });
    const json = res.data;
    if (json?.status_code !== 0) {
      console.error(`[Netify] API Error ${json?.status_code}: ${json?.status_message}`);
      return { applications: [], pagination: {} };
    }
    return {
      applications: json.data || [],
      pagination: json.data_info || {}
    };
  } catch (err) {
    console.error('[Netify] Lookup error:', err.message);
    return { applications: [], pagination: {} };
  }
}

module.exports = {
  fetchLookupApplications,
  fetchTopApps, fetchTopDevices, fetchTopProtocols, fetchTopCountries,
  fetchTopDomains, fetchBandwidthSummary, fetchDiscoveredDevices,
  fetchCyberThreats, fetchFlows, fetchEvents,
  fetchTopAppCategories, fetchTopContinents, fetchTopRegions, fetchTopCities,
  fetchTopVLANs, fetchTopInterfaces, fetchTopFlowTypes, fetchTopFlowOrigins,
  fetchTopIPVersions, fetchTopRemoteIPs, fetchTopLocalMACs,
  fetchTopDiscoveryOS,
  fetchTLSVersions, fetchTLSCiphers, fetchTLSSecurity, fetchNetBIOSHostnames,
  // DPI 12-21 (field name sudah diperbaiki sesuai dokumentasi resmi)
  fetchDHCPClassFingerprints,
  fetchHTTPUserAgents,
  fetchSNIHostnames,
  fetchSSLServerCN,
  fetchQUICHostnames,
  fetchBitTorrentInfoHashes,
  fetchSSHClients,
  fetchSSHServers,
  fetchMDNSHostnames,
  // Intelligence 22-30 (derive dari data yang tersedia)
  fetchCryptoMining,
  fetchDeviceDiscovery,
  fetchEncryptionAudit,
  fetchInsecureProtocols,
  fetchIPReputation,
  fetchServerDiscovery,
  fetchTorDetection,
  fetchUnencryptedPasswords,
  fetchVPNDetection,
};

// ─── DPI FIELDS 12-21 — FIELD NAMES DIPERBAIKI SESUAI DOCS ──────────────────
// Sumber: https://www.netify.ai/documentation/informatics/v2/data/fields
//
// Field yang SALAH sebelumnya → yang BENAR:
//   dhcp_fingerprint  → dhcp_class
//   user_agent        → http_useragent
//   ssl_cn            → https_sni_hostname
//   ssl_server_cn     → ssl_server_cn  ✓ (sudah benar)
//   quic_hostname     → quic_hostname  ✓ (sudah benar, mungkin belum aktif di akun)
//   bt_info_hash      → bittorrent_info_hash
//   ssh_version       → ssh_client / ssh_server (2 field terpisah)
//   mdns_hostname     → mdns_hostname  ✓ (sudah benar, mungkin belum aktif di akun)

// Helper builder untuk DPI single-field
async function _dpiTopField(fieldName, interval, limit) {
  const [dl, ul] = await Promise.all([
    netifyFetch(`/data/stats/top/${fieldName}/download`, { filter_interval: interval, settings_limit: limit }),
    netifyFetch(`/data/stats/top/${fieldName}/upload`,   { filter_interval: interval, settings_limit: limit }),
  ]);
  if (!dl) return null;
  const ulMap = {};
  if (ul) for (const r of ul) {
    const key = r[fieldName]?.name ?? r[fieldName]?.label ?? String(r[fieldName] ?? '');
    if (key) ulMap[key] = r.upload ?? 0;
  }
  return { dl, ulMap };
}

// 12. DHCP Class (field: dhcp_class)
async function fetchDHCPClassFingerprints(interval = 1440, limit = 30) {
  const res = await _dpiTopField('dhcp_class', interval, limit);
  if (!res) return null;
  return res.dl.map(r => {
    const label = r.dhcp_class?.name ?? r.dhcp_class?.label ?? String(r.dhcp_class ?? 'Unknown');
    return {
      fingerprint : label,
      download    : r.download ?? 0,
      upload      : res.ulMap[label] ?? 0,
      total       : (r.download ?? 0) + (res.ulMap[label] ?? 0),
    };
  });
}

// 13. HTTP User-Agent (field: http_useragent)
async function fetchHTTPUserAgents(interval = 1440, limit = 30) {
  const res = await _dpiTopField('http_useragent', interval, limit);
  if (!res) return null;
  return res.dl.map(r => {
    const label = r.http_useragent?.name ?? r.http_useragent?.label ?? String(r.http_useragent ?? 'Unknown');
    return {
      user_agent : label,
      download   : r.download ?? 0,
      upload     : res.ulMap[label] ?? 0,
      total      : (r.download ?? 0) + (res.ulMap[label] ?? 0),
    };
  });
}

// 14. HTTPS SNI Hostname (field: https_sni_hostname)
async function fetchSNIHostnames(interval = 1440, limit = 30) {
  const res = await _dpiTopField('https_sni_hostname', interval, limit);
  if (!res) return null;
  return res.dl.map(r => {
    const name = r.https_sni_hostname?.name ?? r.https_sni_hostname?.label ?? String(r.https_sni_hostname ?? 'Unknown');
    return {
      sni_hostname : name,
      download     : r.download ?? 0,
      upload       : res.ulMap[name] ?? 0,
      total        : (r.download ?? 0) + (res.ulMap[name] ?? 0),
    };
  });
}

// 15. SSL Server Common Name (field: ssl_server_cn)
async function fetchSSLServerCN(interval = 1440, limit = 30) {
  const res = await _dpiTopField('ssl_server_cn', interval, limit);
  if (!res) return null;
  return res.dl.map(r => {
    const name = r.ssl_server_cn?.name ?? r.ssl_server_cn?.label ?? String(r.ssl_server_cn ?? 'Unknown');
    return {
      ssl_server_cn : name,
      download      : r.download ?? 0,
      upload        : res.ulMap[name] ?? 0,
      total         : (r.download ?? 0) + (res.ulMap[name] ?? 0),
    };
  });
}

// 17. QUIC Hostname (field: quic_hostname)
async function fetchQUICHostnames(interval = 1440, limit = 30) {
  const res = await _dpiTopField('quic_hostname', interval, limit);
  if (!res) return null;
  return res.dl.map(r => {
    const name = r.quic_hostname?.name ?? r.quic_hostname?.label ?? String(r.quic_hostname ?? 'Unknown');
    return {
      quic_hostname : name,
      download      : r.download ?? 0,
      upload        : res.ulMap[name] ?? 0,
      total         : (r.download ?? 0) + (res.ulMap[name] ?? 0),
    };
  });
}

// 18. BitTorrent Info Hash (field: bittorrent_info_hash)
async function fetchBitTorrentInfoHashes(interval = 1440, limit = 30) {
  const res = await _dpiTopField('bittorrent_info_hash', interval, limit);
  if (!res) return null;
  return res.dl.map(r => {
    const hash  = r.bittorrent_info_hash?.hash  ?? r.bittorrent_info_hash?.name ?? String(r.bittorrent_info_hash ?? 'Unknown');
    const label = r.bittorrent_info_hash?.label ?? hash;
    return {
      info_hash : hash,
      label     : label,
      download  : r.download ?? 0,
      upload    : res.ulMap[hash] ?? res.ulMap[label] ?? 0,
      total     : (r.download ?? 0) + (res.ulMap[hash] ?? res.ulMap[label] ?? 0),
    };
  });
}

// 19a. SSH Client (field: ssh_client)
async function fetchSSHClients(interval = 1440, limit = 20) {
  const res = await _dpiTopField('ssh_client', interval, limit);
  if (!res) return null;
  return res.dl.map(r => {
    const label = r.ssh_client?.name ?? r.ssh_client?.label ?? String(r.ssh_client ?? 'Unknown');
    return {
      ssh_version : label,
      direction   : 'client',
      download    : r.download ?? 0,
      upload      : res.ulMap[label] ?? 0,
      total       : (r.download ?? 0) + (res.ulMap[label] ?? 0),
    };
  });
}

// 19b. SSH Server (field: ssh_server)
async function fetchSSHServers(interval = 1440, limit = 20) {
  const res = await _dpiTopField('ssh_server', interval, limit);
  if (!res) return null;
  return res.dl.map(r => {
    const label = r.ssh_server?.name ?? r.ssh_server?.label ?? String(r.ssh_server ?? 'Unknown');
    return {
      ssh_version : label,
      direction   : 'server',
      download    : r.download ?? 0,
      upload      : res.ulMap[label] ?? 0,
      total       : (r.download ?? 0) + (res.ulMap[label] ?? 0),
    };
  });
}

// 21. mDNS Hostname (field: mdns_hostname)
async function fetchMDNSHostnames(interval = 1440, limit = 30) {
  const res = await _dpiTopField('mdns_hostname', interval, limit);
  if (!res) return null;
  return res.dl.map(r => {
    const name = r.mdns_hostname?.name ?? r.mdns_hostname?.label ?? String(r.mdns_hostname ?? 'Unknown');
    return {
      mdns_hostname : name,
      download      : r.download ?? 0,
      upload        : res.ulMap[name] ?? 0,
      total         : (r.download ?? 0) + (res.ulMap[name] ?? 0),
    };
  });
}

// ─── INTELLIGENCE 22-30 — DERIVE DARI DATA YANG SUDAH ADA ────────────────────
// Endpoint /intelligence/* dan /events/* semua 404 di akun ini.
// Semua fungsi berikut meng-DERIVE data dari endpoint yang sudah confirmed bekerja:
// /data/stats/top/*, /data/flows
// Ini memberikan data nyata, bukan mock/dummy.

// 22. Cryptocurrency Mining — derive dari apps dengan nama mengandung "crypto" / "mining"
// + flows ke port mining pool (3333, 4444, 8333, 9999, 14444)
async function fetchCryptoMining(interval = 1440, limit = 50) {
  const MINING_POOLS_PORTS = new Set([3333, 4444, 5555, 7777, 8333, 9332, 9999, 14444, 45560, 45700]);
  const MINING_APPS = ['bitcoin', 'crypto', 'mining', 'monero', 'ethereum', 'nicehash', 'nanopool', 'f2pool', 'antpool', 'slushpool'];

  const [appData, flowsRaw] = await Promise.all([
    netifyFetch('/data/stats/top/application/download', { filter_interval: interval, settings_limit: 100 }),
    netifyFetch('/data/flows', { settings_limit: 500 }),
  ]);

  const results = [];

  // Derive dari aplikasi
  if (appData) {
    for (const r of appData) {
      const name = (r.application?.label ?? '').toLowerCase();
      const tag  = (r.application?.tag  ?? '').toLowerCase();
      if (MINING_APPS.some(k => name.includes(k) || tag.includes(k))) {
        results.push({
          detected_at : null,
          ip_address  : null,
          mac_address : null,
          pool_host   : r.application?.label ?? null,
          pool_ip     : null,
          protocol    : null,
          app_label   : r.application?.label ?? null,
          confidence  : 0.7,
          download    : r.download ?? 0,
          upload      : r.upload ?? 0,
          source      : 'derived:app',
        });
      }
    }
  }

  // Derive dari flows ke port mining
  if (flowsRaw) {
    for (const r of flowsRaw) {
      const port = r.remote_port ?? 0;
      if (MINING_POOLS_PORTS.has(port)) {
        results.push({
          detected_at : r.first_seen_at?.date ?? null,
          ip_address  : r.local_ip?.address ?? null,
          mac_address : r.local_mac ?? null,
          pool_host   : null,
          pool_ip     : r.remote_ip?.address ?? null,
          protocol    : r.ip_protocol?.label ?? null,
          app_label   : null,
          confidence  : 0.85,
          download    : r.download ?? 0,
          upload      : r.upload ?? 0,
          source      : 'derived:flow',
        });
      }
    }
  }

  return results.slice(0, limit);
}

// 23. Device Discovery — derive dari flows (perangkat unik dengan MAC)
async function fetchDeviceDiscovery(limit = 100) {
  const [flowsRaw, dlData] = await Promise.all([
    netifyFetch('/data/flows', { settings_limit: 500 }),
    netifyFetch('/data/stats/top/local_ip/download', { filter_interval: 1440, settings_limit: 200 }),
  ]);

  const seen = new Map();
  if (flowsRaw) {
    for (const r of flowsRaw) {
      const ip  = r.local_ip?.address;
      const mac = r.local_mac;
      if (!ip) continue;
      if (!seen.has(ip)) {
        seen.set(ip, {
          detected_at  : r.first_seen_at?.date ?? null,
          ip_address   : ip,
          mac_address  : mac ?? null,
          device_label : r.device?.label ?? null,
          device_type  : r.mac?.discovery_hardware ?? null,
          os_label     : r.discovery_os?.label ?? null,
          manufacturer : mac ? (OUI_MAP[mac.substring(0,8).toUpperCase()] ?? null) : null,
          is_new       : true,
        });
      }
    }
  }

  // Tambah IP yang punya bandwidth tapi tidak ada di flows
  if (dlData) {
    for (const r of dlData) {
      const ip = r.local_ip?.address ?? String(r.local_ip ?? '');
      if (ip && !seen.has(ip)) {
        seen.set(ip, {
          detected_at  : null,
          ip_address   : ip,
          mac_address  : null,
          device_label : null,
          device_type  : null,
          os_label     : null,
          manufacturer : null,
          is_new       : true,
        });
      }
    }
  }

  return Array.from(seen.values()).slice(0, limit);
}

// 24. Encryption Audit — derive dari TLS security per-IP dari flows
async function fetchEncryptionAudit(limit = 50) {
  const [tlsSec, flowsRaw] = await Promise.all([
    netifyFetch('/data/stats/top/tls_security/download', { filter_interval: 1440, settings_limit: 10 }),
    netifyFetch('/data/flows', { settings_limit: 500 }),
  ]);

  // Hitung per-IP: encrypted vs unencrypted flows
  const ipStats = {};
  if (flowsRaw) {
    for (const r of flowsRaw) {
      const ip   = r.local_ip?.address;
      const port = r.remote_port ?? 0;
      const mac  = r.local_mac ?? null;
      if (!ip) continue;
      if (!ipStats[ip]) ipStats[ip] = { mac, encrypted: 0, unencrypted: 0, total_bytes: 0 };
      const bytes = (r.download ?? 0) + (r.upload ?? 0);
      // Port 443, 8443, 465, 993, 995, 22 = encrypted
      const isEnc = [443, 8443, 465, 993, 995, 22, 853].includes(port);
      if (isEnc) ipStats[ip].encrypted    += bytes;
      else       ipStats[ip].unencrypted  += bytes;
      ipStats[ip].total_bytes += bytes;
    }
  }

  return Object.entries(ipStats)
    .map(([ip, s]) => {
      const total    = s.encrypted + s.unencrypted;
      const enc_pct  = total > 0 ? (s.encrypted / total) * 100 : null;
      const risk     = enc_pct === null ? null
                     : enc_pct >= 90   ? 'Low'
                     : enc_pct >= 60   ? 'Medium'
                     : enc_pct >= 30   ? 'High'
                     : 'Critical';
      const oui = s.mac ? s.mac.substring(0,8).toUpperCase() : null;
      return {
        ip_address    : ip,
        mac_address   : s.mac,
        device_label  : OUI_MAP[oui] ?? null,
        encrypted_pct : enc_pct != null ? Math.round(enc_pct * 10) / 10 : null,
        encrypted     : s.encrypted,
        unencrypted   : s.unencrypted,
        total         : total,
        risk_level    : risk,
        detected_at   : null,
      };
    })
    .sort((a, b) => (a.encrypted_pct ?? 101) - (b.encrypted_pct ?? 101))
    .slice(0, limit);
}

// 25. Insecure Protocols — derive dari top protocols (confirmed bekerja)
async function fetchInsecureProtocols(interval = 1440, limit = 50) {
  const INSECURE = {
    'HTTP'   : { port: 80,   risk: 'High' },
    'FTP'    : { port: 21,   risk: 'Critical' },
    'Telnet' : { port: 23,   risk: 'Critical' },
    'SMTP'   : { port: 25,   risk: 'Medium' },
    'POP3'   : { port: 110,  risk: 'Medium' },
    'IMAP'   : { port: 143,  risk: 'Medium' },
    'DNS'    : { port: 53,   risk: 'Low' },
    'SNMP'   : { port: 161,  risk: 'High' },
    'LDAP'   : { port: 389,  risk: 'High' },
    'RDP'    : { port: 3389, risk: 'High' },
    'NTP'    : { port: 123,  risk: 'Low' },
    'TFTP'   : { port: 69,   risk: 'High' },
    'rsh'    : { port: 514,  risk: 'Critical' },
    'rlogin' : { port: 513,  risk: 'Critical' },
  };

  const [protoData, ulData] = await Promise.all([
    netifyFetch('/data/stats/top/protocol/download', { filter_interval: interval, settings_limit: 100 }),
    netifyFetch('/data/stats/top/protocol/upload',   { filter_interval: interval, settings_limit: 100 }),
  ]);
  if (!protoData) return [];

  const ulMap = {};
  if (ulData) for (const r of ulData) {
    const id = r.protocol?.id;
    if (id) ulMap[id] = r.upload ?? 0;
  }

  return protoData
    .filter(r => INSECURE[r.protocol?.label])
    .map(r => {
      const label = r.protocol?.label ?? 'Unknown';
      const info  = INSECURE[label];
      return {
        protocol    : label,
        ip_address  : null,
        mac_address : null,
        dst_ip      : null,
        dst_port    : info.port,
        app_label   : null,
        download    : r.download ?? 0,
        upload      : ulMap[r.protocol?.id] ?? 0,
        risk        : info.risk,
        detected_at : null,
        source      : 'derived',
      };
    })
    .slice(0, limit);
}

// 26. IP Reputation — derive dari top remote_ip + cross-check negara berisiko tinggi
async function fetchIPReputation(limit = 50) {
  // Negara dengan risiko tinggi berdasarkan threat intel umum
  const HIGH_RISK_COUNTRIES = new Set([
    'China', 'Russia', 'Iran', 'North Korea', 'Nigeria', 'Romania',
    'Brazil', 'Ukraine', 'Vietnam', 'Indonesia',
  ]);

  const [ipData, countryData] = await Promise.all([
    netifyFetch('/data/stats/top/remote_ip/download', { filter_interval: 1440, settings_limit: 100 }),
    netifyFetch('/data/stats/top/country/download',   { filter_interval: 1440, settings_limit: 50 }),
  ]);

  const results = [];

  if (ipData) {
    // Tandai IP dari negara berisiko (informasi negara tidak ada per-IP dari API,
    // jadi kita pakai country data untuk konteks)
    for (const r of ipData) {
      const ip = r.remote_ip?.address ?? String(r.remote_ip ?? '');
      if (!ip) continue;
      results.push({
        ip_address  : ip,
        local_ip    : null,
        mac_address : null,
        reputation  : 'Unknown',
        score       : null,
        country     : null,
        app_label   : null,
        download    : r.download ?? 0,
        upload      : r.upload ?? 0,
        detected_at : null,
        blacklisted : false,
        source      : 'derived:top_ip',
      });
    }
  }

  // Tambah entri untuk negara berisiko yang terdeteksi
  if (countryData) {
    for (const r of countryData) {
      const country = r.country?.label ?? '';
      if (HIGH_RISK_COUNTRIES.has(country)) {
        results.push({
          ip_address  : null,
          local_ip    : null,
          mac_address : null,
          reputation  : 'High-Risk Country',
          score       : 0.7,
          country     : country,
          app_label   : null,
          download    : r.download ?? 0,
          upload      : r.upload ?? 0,
          detected_at : null,
          blacklisted : false,
          source      : 'derived:country',
        });
      }
    }
  }

  return results.slice(0, limit);
}

// 27. Server Discovery — derive dari flows dengan flow_origin=Server + port well-known server
async function fetchServerDiscovery(limit = 100) {
  const SERVER_PORTS = {
    80: 'HTTP', 443: 'HTTPS', 22: 'SSH', 21: 'FTP', 25: 'SMTP',
    110: 'POP3', 143: 'IMAP', 3306: 'MySQL', 5432: 'PostgreSQL',
    6379: 'Redis', 27017: 'MongoDB', 8080: 'HTTP-Alt', 8443: 'HTTPS-Alt',
    53: 'DNS', 3389: 'RDP', 5900: 'VNC', 161: 'SNMP', 123: 'NTP',
    389: 'LDAP', 636: 'LDAPS', 5060: 'SIP', 1194: 'OpenVPN',
  };

  const [flowOriginData, flowsRaw] = await Promise.all([
    netifyFetch('/data/stats/top/flow_origin/download', { filter_interval: 1440, settings_limit: 10 }),
    netifyFetch('/data/flows', { settings_limit: 500 }),
  ]);

  const serverMap = {};
  if (flowsRaw) {
    for (const r of flowsRaw) {
      const localIP  = r.local_ip?.address;
      const localPort = r.local_port ?? r.remote_port;
      const proto    = r.ip_protocol?.label ?? null;
      const mac      = r.local_mac ?? null;
      if (!localIP) continue;

      // Deteksi server: local device listening di port well-known
      const svcName = SERVER_PORTS[localPort] ?? SERVER_PORTS[r.remote_port];
      if (svcName) {
        const key = `${localIP}:${localPort ?? r.remote_port}`;
        if (!serverMap[key]) {
          const oui = mac ? mac.substring(0,8).toUpperCase() : null;
          serverMap[key] = {
            detected_at : r.first_seen_at?.date ?? null,
            ip_address  : localIP,
            mac_address : mac,
            server_type : svcName,
            hostname    : r.device?.label ?? null,
            port        : localPort ?? r.remote_port,
            protocol    : proto,
            os_label    : null,
            download    : 0,
            upload      : 0,
          };
        }
        serverMap[key].download += r.download ?? 0;
        serverMap[key].upload   += r.upload   ?? 0;
      }
    }
  }

  return Object.values(serverMap)
    .sort((a, b) => (b.download + b.upload) - (a.download + a.upload))
    .slice(0, limit);
}

// 28. Tor Detection — derive dari top remote_ip + app/hostname matching Tor
async function fetchTorDetection(limit = 50) {
  const TOR_INDICATORS = ['tor', '.onion', 'torproject', 'torbrowser'];

  const [appData, domainData] = await Promise.all([
    netifyFetch('/data/stats/top/application/download', { filter_interval: 1440, settings_limit: 100 }),
    netifyFetch('/data/stats/top/hostname/download',    { filter_interval: 1440, settings_limit: 100 }),
  ]);

  const results = [];

  if (appData) {
    for (const r of appData) {
      const name = (r.application?.label ?? '').toLowerCase();
      const tag  = (r.application?.tag  ?? '').toLowerCase();
      if (TOR_INDICATORS.some(k => name.includes(k) || tag.includes(k))) {
        results.push({
          detected_at : null,
          ip_address  : null,
          mac_address : null,
          exit_node   : null,
          circuit_id  : null,
          download    : r.download ?? 0,
          upload      : r.upload ?? 0,
          country     : null,
          source      : 'derived:app',
          label       : r.application?.label,
        });
      }
    }
  }

  if (domainData) {
    for (const r of domainData) {
      const host = (r.hostname?.name ?? '').toLowerCase();
      if (TOR_INDICATORS.some(k => host.includes(k))) {
        results.push({
          detected_at : null,
          ip_address  : null,
          mac_address : null,
          exit_node   : null,
          circuit_id  : null,
          download    : r.download ?? 0,
          upload      : 0,
          country     : null,
          source      : 'derived:hostname',
          label       : r.hostname?.name,
        });
      }
    }
  }

  return results.slice(0, limit);
}

// 29. Unencrypted Passwords — derive dari flows ke port cleartext auth
async function fetchUnencryptedPasswords(limit = 50) {
  // Port yang dikenal mengirim kredensial cleartext
  const CLEARTEXT_AUTH_PORTS = {
    21  : { protocol: 'FTP',    severity: 'Critical' },
    23  : { protocol: 'Telnet', severity: 'Critical' },
    25  : { protocol: 'SMTP',   severity: 'High' },
    80  : { protocol: 'HTTP',   severity: 'High' },
    110 : { protocol: 'POP3',   severity: 'High' },
    143 : { protocol: 'IMAP',   severity: 'High' },
    389 : { protocol: 'LDAP',   severity: 'Critical' },
    512 : { protocol: 'rexec',  severity: 'Critical' },
    513 : { protocol: 'rlogin', severity: 'Critical' },
    514 : { protocol: 'rsh',    severity: 'Critical' },
  };

  const flowsRaw = await netifyFetch('/data/flows', { settings_limit: 500 });
  if (!flowsRaw) return [];

  const seen = new Map();
  for (const r of flowsRaw) {
    const port = r.remote_port ?? 0;
    const info = CLEARTEXT_AUTH_PORTS[port];
    if (!info) continue;

    const key = `${r.local_ip?.address}:${r.remote_ip?.address}:${port}`;
    if (!seen.has(key)) {
      seen.set(key, {
        detected_at : r.first_seen_at?.date ?? null,
        ip_address  : r.local_ip?.address ?? null,
        mac_address : r.local_mac ?? null,
        dst_ip      : r.remote_ip?.address ?? null,
        dst_port    : port,
        protocol    : info.protocol,
        username    : null,
        download    : 0,
        upload      : 0,
        severity    : info.severity,
      });
    }
    seen.get(key).download += r.download ?? 0;
    seen.get(key).upload   += r.upload   ?? 0;
  }

  return Array.from(seen.values())
    .sort((a, b) => (b.download + b.upload) - (a.download + a.upload))
    .slice(0, limit);
}

// 30. VPN Detection — derive dari apps/protocols/hostnames yang mengindikasikan VPN
async function fetchVPNDetection(limit = 50) {
  const VPN_APPS = [
    'openvpn', 'wireguard', 'nordvpn', 'expressvpn', 'surfshark', 'tunnelbear',
    'mullvad', 'protonvpn', 'ipvanish', 'pia', 'private internet access',
    'hotspot shield', 'cyberghost', 'vpn', 'pptp', 'l2tp', 'ipsec', 'sstp',
    'shadowsocks', 'v2ray', 'trojan', 'outline',
  ];
  const VPN_PROTOCOLS = new Set(['OpenVPN', 'WireGuard', 'IPSec', 'PPTP', 'L2TP', 'GRE', 'SSTP']);
  // Port yang umum digunakan VPN
  const VPN_PORTS = new Set([1194, 51820, 500, 4500, 1701, 1723, 8388, 443]);

  const [appData, protoData, flowsRaw] = await Promise.all([
    netifyFetch('/data/stats/top/application/download', { filter_interval: 1440, settings_limit: 100 }),
    netifyFetch('/data/stats/top/protocol/download',    { filter_interval: 1440, settings_limit: 50 }),
    netifyFetch('/data/flows', { settings_limit: 500 }),
  ]);

  const results = [];

  if (appData) {
    for (const r of appData) {
      const name = (r.application?.label ?? '').toLowerCase();
      const tag  = (r.application?.tag  ?? '').toLowerCase();
      if (VPN_APPS.some(k => name.includes(k) || tag.includes(k))) {
        results.push({
          detected_at : null,
          ip_address  : null,
          mac_address : null,
          vpn_type    : r.application?.label ?? 'Unknown VPN',
          remote_ip   : null,
          protocol    : null,
          download    : r.download ?? 0,
          upload      : r.upload ?? 0,
          country     : null,
          confidence  : 0.9,
          source      : 'derived:app',
        });
      }
    }
  }

  if (protoData) {
    for (const r of protoData) {
      const label = r.protocol?.label ?? '';
      if (VPN_PROTOCOLS.has(label)) {
        results.push({
          detected_at : null,
          ip_address  : null,
          mac_address : null,
          vpn_type    : label,
          remote_ip   : null,
          protocol    : label,
          download    : r.download ?? 0,
          upload      : r.upload ?? 0,
          country     : null,
          confidence  : 0.85,
          source      : 'derived:protocol',
        });
      }
    }
  }

  if (flowsRaw) {
    const portSeen = new Set();
    for (const r of flowsRaw) {
      const port = r.remote_port ?? 0;
      if (VPN_PORTS.has(port) && !portSeen.has(port)) {
        portSeen.add(port);
        results.push({
          detected_at : r.first_seen_at?.date ?? null,
          ip_address  : r.local_ip?.address ?? null,
          mac_address : r.local_mac ?? null,
          vpn_type    : `Port ${port}`,
          remote_ip   : r.remote_ip?.address ?? null,
          protocol    : r.ip_protocol?.label ?? null,
          download    : r.download ?? 0,
          upload      : r.upload ?? 0,
          country     : null,
          confidence  : 0.75,
          source      : 'derived:port',
        });
      }
    }
  }

  return results.slice(0, limit);
}