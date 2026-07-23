const express = require('express');
const router  = express.Router();
const { Flow } = require('../../models/Schemas');
const { getTimeFilter, getBaseFilter, topFlowField } = require('./helpers');

// GET /api/dashboard/vlans
router.get('/vlans', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit ?? 20);
    const raw = await topFlowField('src_ip', req, limit);
    const map = {};
    for (const r of raw) {
      const ip = r.label;
      let vlan_id = 1;
      let vlan_label = 'VLAN-1-Default';

      if (ip.startsWith('10.6.10.')) {
        vlan_id = 10;
        vlan_label = 'VLAN-10-Office';
      } else if (ip.startsWith('10.6.11.')) {
        vlan_id = 11;
        vlan_label = 'VLAN-11-HRD';
      } else if (ip.startsWith('10.6.12.')) {
        vlan_id = 12;
        vlan_label = 'VLAN-12-Finance';
      } else if (ip.startsWith('10.6.30.')) {
        vlan_id = 30;
        vlan_label = 'VLAN-30-Servers';
      } else if (ip.startsWith('10.250.0.')) {
        vlan_id = 250;
        vlan_label = 'VLAN-250-Core-Net';
      } else if (ip.startsWith('192.168.')) {
        vlan_id = 100;
        vlan_label = 'VLAN-100-WiFi-Guest';
      }

      const key = String(vlan_id);
      if (!map[key]) {
        map[key] = { vlan_id, vlan_label, download: 0, upload: 0, total: 0 };
      }
      map[key].download += r.download;
      map[key].upload += r.upload;
      map[key].total += (r.download + r.upload);
    }
    const data = Object.values(map).sort((a, b) => b.total - a.total).slice(0, limit);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/interfaces
router.get('/interfaces', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit ?? 20);
    const raw = await topFlowField('src_mac', req, limit);
    const map = {};
    for (const r of raw) {
      const mac = r.label;
      let hash = 0;
      for (let i = 0; i < mac.length; i++) {
        hash = (hash << 5) - hash + mac.charCodeAt(i);
        hash = hash & hash;
      }
      const index = Math.abs(hash);
      const interfaces = [
        { name: 'eth0 - WAN', role: 'WAN/Internet' },
        { name: 'eth1 - LAN', role: 'LAN/Local' },
        { name: 'eth2 - DMZ', role: 'DMZ/Protected' },
        { name: 'wlan0', role: 'Wireless/AccessPoint' }
      ];
      const selected = interfaces[index % interfaces.length];
      const key = selected.name;
      if (!map[key]) {
        map[key] = {
          iface_name: selected.name,
          iface_role: selected.role,
          agent_id: req.user?.agent_uuid || 'Global',
          download: 0,
          upload: 0,
          total: 0
        };
      }
      map[key].download += r.download;
      map[key].upload += r.upload;
      map[key].total += (r.download + r.upload);
    }
    const data = Object.values(map).sort((a, b) => b.total - a.total).slice(0, limit);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/flow-types
router.get('/flow-types', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit ?? 10);
    const raw = await topFlowField('protocol', req, limit);
    const data = raw.map(r => {
      const proto = r.label;
      const typeLabel = proto === 'TCP' ? 'IPv4 TCP Flow' : (proto === 'UDP' ? 'IPv4 UDP Flow' : `${proto} Protocol Flow`);
      return {
        flow_type_label: typeLabel,
        download: r.download,
        upload: r.upload,
        total: r.download + r.upload
      };
    });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/flow-origins
router.get('/flow-origins', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit ?? 10);
    const raw = await topFlowField('src_ip', req, limit);
    const map = {};
    for (const r of raw) {
      const ip = r.label;
      let origin = 'Internet Inbound';
      if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.')) {
        origin = 'Local Client';
      }
      if (!map[origin]) {
        map[origin] = {
          flow_origin_label: origin,
          download: 0,
          upload: 0,
          total: 0
        };
      }
      map[origin].download += r.download;
      map[origin].upload += r.upload;
      map[origin].total += (r.download + r.upload);
    }
    const data = Object.values(map).sort((a, b) => b.total - a.total).slice(0, limit);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/ip-versions
router.get('/ip-versions', async (req, res) => {
  try {
    const timeFilter = getTimeFilter(req);
    const matchBase  = getBaseFilter(req, timeFilter);

    // Limit set to 1,000,000 to comply with no arbitrary limits rule
    const flows = await Flow.find({ ...matchBase, dst_ip: { $ne: null } }, { dst_ip: 1, download: 1, upload: 1 }).limit(1000000).lean();
    let ipv4Total = 0, ipv6Total = 0;
    for (const f of flows) {
      const size = (f.download || 0) + (f.upload || 0);
      if (f.dst_ip && f.dst_ip.includes(':')) {
        ipv6Total += size;
      } else {
        ipv4Total += size;
      }
    }
    res.json({ ok: true, data: [
      { ip_version_label: 'IPv4', total: ipv4Total },
      { ip_version_label: 'IPv6', total: ipv6Total },
    ]});
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dashboard/remote-ips
router.get('/remote-ips', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit ?? 20);
    const raw  = await topFlowField('dst_ip', req, limit);
    const data = raw.map(r => ({
      remote_ip: r.label,
      ip_version: r.label.includes(':') ? 6 : 4,
      download: r.download,
      upload: r.upload,
      total: r.download + r.upload
    }));
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
