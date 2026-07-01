// backend/netify.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const axios = require('axios');

const BASE_URL  = 'https://informatics.netify.ai/api/v1';
const JWT_TOKEN = process.env.NETIFY_JWT_TOKEN;
const SITE_UUID = process.env.NETIFY_SITE_UUID;

function headersSite(useApiKey = false) {
  const token = process.env.NETIFY_API_KEY || JWT_TOKEN;
  const headers = { 'x-api-key': token, 'Accept': 'application/json' };
  if (SITE_UUID) {
    headers['x-net-site'] = SITE_UUID;
  }
  return headers;
}

function getMockDataForPath(path, params = {}) {
  if (path.includes('/data/stats/top/application/download')) {
    return [
      { application: { id: 1, label: 'YouTube', tag: 'video', category: { label: 'Streaming' } }, download: Math.floor(Math.random() * 50000000) + 10000000, flows: Math.floor(Math.random() * 200) + 50 },
      { application: { id: 2, label: 'Netflix', tag: 'video', category: { label: 'Streaming' } }, download: Math.floor(Math.random() * 40000000) + 8000000, flows: Math.floor(Math.random() * 100) + 30 },
      { application: { id: 3, label: 'Web Browsing', tag: 'web', category: { label: 'General' } }, download: Math.floor(Math.random() * 30000000) + 5000000, flows: Math.floor(Math.random() * 500) + 200 },
      { application: { id: 4, label: 'Google Services', tag: 'google', category: { label: 'Tech' } }, download: Math.floor(Math.random() * 25000000) + 4000000, flows: Math.floor(Math.random() * 400) + 150 },
      { application: { id: 5, label: 'WhatsApp', tag: 'im', category: { label: 'Chat' } }, download: Math.floor(Math.random() * 15000000) + 2000000, flows: Math.floor(Math.random() * 300) + 100 },
      { application: { id: 6, label: 'Spotify', tag: 'music', category: { label: 'Streaming' } }, download: Math.floor(Math.random() * 12000000) + 1000000, flows: Math.floor(Math.random() * 80) + 20 },
      { application: { id: 7, label: 'GitHub', tag: 'developer', category: { label: 'General' } }, download: Math.floor(Math.random() * 8000000) + 500000, flows: Math.floor(Math.random() * 120) + 40 },
      { application: { id: 8, label: 'OpenVPN', tag: 'vpn', category: { label: 'Security' } }, download: Math.floor(Math.random() * 5000000) + 300000, flows: Math.floor(Math.random() * 50) + 10 },
      { application: { id: 9, label: 'BitTorrent', tag: 'p2p', category: { label: 'File Sharing' } }, download: Math.floor(Math.random() * 20000000) + 500000, flows: Math.floor(Math.random() * 300) + 50 }
    ];
  }
  if (path.includes('/data/stats/top/application/upload')) {
    return [
      { application: { id: 1 }, upload: Math.floor(Math.random() * 5000000) + 1000000 },
      { application: { id: 2 }, upload: Math.floor(Math.random() * 2000000) + 500000 },
      { application: { id: 3 }, upload: Math.floor(Math.random() * 6000000) + 2000000 },
      { application: { id: 4 }, upload: Math.floor(Math.random() * 4000000) + 1000000 },
      { application: { id: 5 }, upload: Math.floor(Math.random() * 8000000) + 3000000 },
      { application: { id: 6 }, upload: Math.floor(Math.random() * 1000000) + 200000 },
      { application: { id: 7 }, upload: Math.floor(Math.random() * 3000000) + 800000 },
      { application: { id: 8 }, upload: Math.floor(Math.random() * 4000000) + 1000000 },
      { application: { id: 9 }, upload: Math.floor(Math.random() * 18000000) + 2000000 }
    ];
  }
  if (path.includes('/intelligence/discovery/devices')) {
    return [
      { ip: { address: '192.168.1.10' }, mac_address: 'E4:5F:01:23:45:67', mac_vendor: 'Raspberry Pi', device: { label: 'Home Server' }, discovery_type: { label: 'Server' }, discovery_os: { label: 'Linux' }, last_seen_at: { date: new Date().toISOString() } },
      { ip: { address: '192.168.1.25' }, mac_address: 'B4:FB:E4:88:99:AA', mac_vendor: 'Samsung', device: { label: 'Smart TV' }, discovery_type: { label: 'TV' }, discovery_os: { label: 'Tizen' }, last_seen_at: { date: new Date().toISOString() } },
      { ip: { address: '192.168.1.100' }, mac_address: '3C:28:6D:AA:BB:CC', mac_vendor: 'Apple', device: { label: 'iPhone User' }, discovery_type: { label: 'Mobile' }, discovery_os: { label: 'iOS' }, last_seen_at: { date: new Date().toISOString() } },
      { ip: { address: '192.168.1.101' }, mac_address: '28:31:52:DD:EE:FF', mac_vendor: 'Xiaomi', device: { label: 'Redmi Phone' }, discovery_type: { label: 'Mobile' }, discovery_os: { label: 'Android' }, last_seen_at: { date: new Date().toISOString() } },
      { ip: { address: '192.168.1.102' }, mac_address: '00:15:5D:11:22:33', mac_vendor: 'Microsoft Hyper-V', device: { label: 'Windows PC' }, discovery_type: { label: 'Desktop' }, discovery_os: { label: 'Windows' }, last_seen_at: { date: new Date().toISOString() } }
    ];
  }
  if (path.includes('/data/stats/top/local_ip/download')) {
    return [
      { local_ip: { address: '192.168.1.100' }, download: Math.floor(Math.random() * 40000000) + 10000000 },
      { local_ip: { address: '192.168.1.102' }, download: Math.floor(Math.random() * 30000000) + 8000000 },
      { local_ip: { address: '192.168.1.101' }, download: Math.floor(Math.random() * 15000000) + 3000000 },
      { local_ip: { address: '192.168.1.25' }, download: Math.floor(Math.random() * 25000000) + 5000000 },
      { local_ip: { address: '192.168.1.10' }, download: Math.floor(Math.random() * 8000000) + 2000000 }
    ];
  }
  if (path.includes('/data/stats/top/local_ip/upload')) {
    return [
      { local_ip: { address: '192.168.1.100' }, upload: Math.floor(Math.random() * 5000000) + 1000000 },
      { local_ip: { address: '192.168.1.102' }, upload: Math.floor(Math.random() * 8000000) + 2000000 },
      { local_ip: { address: '192.168.1.101' }, upload: Math.floor(Math.random() * 2000000) + 500000 },
      { local_ip: { address: '192.168.1.25' }, upload: Math.floor(Math.random() * 1000000) + 100000 },
      { local_ip: { address: '192.168.1.10' }, upload: Math.floor(Math.random() * 4000000) + 1000000 }
    ];
  }
  if (path.includes('/data/stats/top/protocol/download')) {
    return [
      { protocol: { id: 6, label: 'TCP' }, download: Math.floor(Math.random() * 100000000) + 40000000, flows: Math.floor(Math.random() * 1000) + 400 },
      { protocol: { id: 17, label: 'UDP' }, download: Math.floor(Math.random() * 30000000) + 10000000, flows: Math.floor(Math.random() * 800) + 200 }
    ];
  }
  if (path.includes('/data/stats/top/protocol/upload')) {
    return [
      { protocol: { id: 6 }, upload: Math.floor(Math.random() * 20000000) + 5000000 },
      { protocol: { id: 17 }, upload: Math.floor(Math.random() * 10000000) + 2000000 }
    ];
  }
  if (path.includes('/data/stats/top/country/download')) {
    return [
      { country: { code: 'US', label: 'United States' }, download: Math.floor(Math.random() * 60000000) + 20000000, flows: Math.floor(Math.random() * 500) + 200 },
      { country: { code: 'SG', label: 'Singapore' }, download: Math.floor(Math.random() * 40000000) + 10000000, flows: Math.floor(Math.random() * 300) + 100 },
      { country: { code: 'ID', label: 'Indonesia' }, download: Math.floor(Math.random() * 20000000) + 5000000, flows: Math.floor(Math.random() * 400) + 150 },
      { country: { code: 'NL', label: 'Netherlands' }, download: Math.floor(Math.random() * 10000000) + 2000000, flows: Math.floor(Math.random() * 100) + 30 }
    ];
  }
  if (path.includes('/data/stats/top/country/upload')) {
    return [
      { country: { code: 'US' }, upload: Math.floor(Math.random() * 12000000) + 3000000 },
      { country: { code: 'SG' }, upload: Math.floor(Math.random() * 8000000) + 2000000 },
      { country: { code: 'ID' }, upload: Math.floor(Math.random() * 4000000) + 1000000 },
      { country: { code: 'NL' }, upload: Math.floor(Math.random() * 2000000) + 500000 }
    ];
  }
  if (path.includes('/data/stats/top/hostname/download')) {
    return [
      { hostname: { name: 'youtube.com', application_name: 'YouTube', application_category_label: 'Streaming' }, download: Math.floor(Math.random() * 30000000) + 10000000, flows: Math.floor(Math.random() * 100) + 20 },
      { hostname: { name: 'netflix.com', application_name: 'Netflix', application_category_label: 'Streaming' }, download: Math.floor(Math.random() * 20000000) + 5000000, flows: Math.floor(Math.random() * 50) + 10 },
      { hostname: { name: 'google.com', application_name: 'Google', application_category_label: 'Web' }, download: Math.floor(Math.random() * 15000000) + 3000000, flows: Math.floor(Math.random() * 400) + 100 },
      { hostname: { name: 'github.com', application_name: 'GitHub', application_category_label: 'Web' }, download: Math.floor(Math.random() * 8000000) + 2000000, flows: Math.floor(Math.random() * 150) + 30 }
    ];
  }
  if (path.includes('/data/stats/top/hostname/upload')) {
    return [
      { hostname: { name: 'youtube.com' }, upload: Math.floor(Math.random() * 2000000) + 500000 },
      { hostname: { name: 'netflix.com' }, upload: Math.floor(Math.random() * 1000000) + 200000 },
      { hostname: { name: 'google.com' }, upload: Math.floor(Math.random() * 3000000) + 500000 },
      { hostname: { name: 'github.com' }, upload: Math.floor(Math.random() * 2000000) + 400000 }
    ];
  }
  if (path.includes('/data/flows')) {
    return [
      { flow_id: 'flow_1', local_ip: { address: '192.168.1.100' }, local_mac: '3C:28:6D:AA:BB:CC', remote_ip: { address: '172.217.194.95' }, remote_port: 443, ip_protocol: { label: 'TCP' }, download: Math.floor(Math.random() * 50000) + 5000, upload: Math.floor(Math.random() * 5000) + 500, first_seen_at: { date: new Date(Date.now() - 300000).toISOString() }, last_seen_at: { date: new Date().toISOString() } },
      { flow_id: 'flow_2', local_ip: { address: '192.168.1.102' }, local_mac: '00:15:5D:11:22:33', remote_ip: { address: '140.82.112.4' }, remote_port: 443, ip_protocol: { label: 'TCP' }, download: Math.floor(Math.random() * 20000) + 2000, upload: Math.floor(Math.random() * 10000) + 1000, first_seen_at: { date: new Date(Date.now() - 600000).toISOString() }, last_seen_at: { date: new Date().toISOString() } },
      { flow_id: 'flow_3', local_ip: { address: '192.168.1.101' }, local_mac: '28:31:52:DD:EE:FF', remote_ip: { address: '31.13.78.35' }, remote_port: 443, ip_protocol: { label: 'TCP' }, download: Math.floor(Math.random() * 15000) + 1000, upload: Math.floor(Math.random() * 2000) + 200, first_seen_at: { date: new Date(Date.now() - 120000).toISOString() }, last_seen_at: { date: new Date().toISOString() } },
      { flow_id: 'flow_4', local_ip: { address: '192.168.1.10' }, local_mac: 'E4:5F:01:23:45:67', remote_ip: { address: '8.8.8.8' }, remote_port: 53, ip_protocol: { label: 'UDP' }, download: Math.floor(Math.random() * 2000) + 200, upload: Math.floor(Math.random() * 2000) + 200, first_seen_at: { date: new Date(Date.now() - 50000).toISOString() }, last_seen_at: { date: new Date().toISOString() } }
    ];
  }
  if (path.includes('/event/events')) {
    return [
      { id: Math.floor(Math.random() * 10000), basename: 'threat.cryptomining', severity: 30, label: 'Suspicious Cryptomining Activity', description: JSON.stringify({ default: 'Connection to mining pool detected from {{ device_ip }}', tags: { device_ip: '192.168.1.10' } }), created_at: { date: new Date().toISOString() } },
      { id: Math.floor(Math.random() * 10000), basename: 'threat.insecure', severity: 20, label: 'Insecure Cleartext Transmission', description: JSON.stringify({ default: 'Cleartext credentials transmitted by {{ device_ip }}', tags: { device_ip: '192.168.1.102' } }), created_at: { date: new Date(Date.now() - 300000).toISOString() } },
      { id: Math.floor(Math.random() * 10000), basename: 'new.device', severity: 10, label: 'New Device Discovered', description: JSON.stringify({ default: 'New device {{ device_label }} discovered at {{ device_ip }}', tags: { device_label: 'Redmi Phone', device_ip: '192.168.1.101' } }), created_at: { date: new Date(Date.now() - 600000).toISOString() } }
    ];
  }
  
  if (path.includes('/data/stats/top/')) {
    const segments = path.split('/');
    const fieldName = segments[segments.length - 2];
    const direction = segments[segments.length - 1];
    
    if (fieldName === 'application_category') {
      const cats = ['Streaming', 'Social Media', 'Web Browsing', 'File Sharing', 'Communication', 'Collaboration', 'Security'];
      return cats.map((c) => ({
        application_category: { name: c, label: c },
        download: direction === 'download' ? Math.floor(Math.random() * 40000000) + 5000000 : 0,
        upload: direction === 'upload' ? Math.floor(Math.random() * 10000000) + 1000000 : 0
      }));
    }
    if (fieldName === 'continent') {
      const conts = ['North America', 'Asia', 'Europe', 'Oceania'];
      return conts.map((c) => ({
        continent: { name: c, label: c },
        download: direction === 'download' ? Math.floor(Math.random() * 50000000) + 10000000 : 0,
        upload: direction === 'upload' ? Math.floor(Math.random() * 15000000) + 2000000 : 0
      }));
    }
    if (fieldName === 'region') {
      const regs = ['California', 'Singapore Region', 'Jakarta Region', 'Frankfurt Region'];
      return regs.map((c) => ({
        region: { name: c, label: c },
        download: direction === 'download' ? Math.floor(Math.random() * 30000000) + 5000000 : 0,
        upload: direction === 'upload' ? Math.floor(Math.random() * 10000000) + 1000000 : 0
      }));
    }
    if (fieldName === 'city') {
      const cities = ['San Francisco', 'Singapore', 'Jakarta', 'Frankfurt'];
      return cities.map((c) => ({
        city: { name: c, label: c },
        download: direction === 'download' ? Math.floor(Math.random() * 30000000) + 5000000 : 0,
        upload: direction === 'upload' ? Math.floor(Math.random() * 10000000) + 1000000 : 0
      }));
    }
    if (fieldName === 'vlan') {
      const vlans = ['VLAN 1 (Default)', 'VLAN 10 (IoT)', 'VLAN 20 (Guest)'];
      return vlans.map((c) => ({
        vlan: { name: c, label: c },
        download: direction === 'download' ? Math.floor(Math.random() * 50000000) + 10000000 : 0,
        upload: direction === 'upload' ? Math.floor(Math.random() * 15000000) + 2000000 : 0
      }));
    }
    if (fieldName === 'interface') {
      const ifaces = ['eth0 (WAN)', 'eth1 (LAN)', 'wlan0 (WiFi)'];
      return ifaces.map((c) => ({
        interface: { name: c, label: c },
        download: direction === 'download' ? Math.floor(Math.random() * 60000000) + 10000000 : 0,
        upload: direction === 'upload' ? Math.floor(Math.random() * 20000000) + 2000000 : 0
      }));
    }
    if (fieldName === 'flow_type') {
      const types = ['HTTP/HTTPS', 'DNS', 'SSH', 'VPN', 'P2P'];
      return types.map((c) => ({
        flow_type: { name: c, label: c },
        download: direction === 'download' ? Math.floor(Math.random() * 40000000) + 5000000 : 0,
        upload: direction === 'upload' ? Math.floor(Math.random() * 10000000) + 1000000 : 0
      }));
    }
    if (fieldName === 'flow_origin') {
      const origs = ['Local LAN', 'Inbound WAN'];
      return origs.map((c) => ({
        flow_origin: { name: c, label: c },
        download: direction === 'download' ? Math.floor(Math.random() * 50000000) + 10000000 : 0,
        upload: direction === 'upload' ? Math.floor(Math.random() * 15000000) + 2000000 : 0
      }));
    }
    if (fieldName === 'ip_version') {
      const versions = ['IPv4', 'IPv6'];
      return versions.map((c) => ({
        ip_version: { name: c, label: c },
        download: direction === 'download' ? Math.floor(Math.random() * 80000000) + 20000000 : 0,
        upload: direction === 'upload' ? Math.floor(Math.random() * 25000000) + 5000000 : 0
      }));
    }
    if (fieldName === 'remote_ip') {
      const ips = ['8.8.8.8', '1.1.1.1', '140.82.112.4', '172.217.194.95'];
      return ips.map((c) => ({
        remote_ip: { address: c, version: 4 },
        download: direction === 'download' ? Math.floor(Math.random() * 20000000) + 5000000 : 0,
        upload: direction === 'upload' ? Math.floor(Math.random() * 5000000) + 500000 : 0
      }));
    }
    if (fieldName === 'local_mac') {
      const macs = ['3C:28:6D:AA:BB:CC', '00:15:5D:11:22:33', '28:31:52:DD:EE:FF', 'E4:5F:01:23:45:67'];
      return macs.map((c) => ({
        local_mac: c,
        download: direction === 'download' ? Math.floor(Math.random() * 30000000) + 5000000 : 0,
        upload: direction === 'upload' ? Math.floor(Math.random() * 10000000) + 1000000 : 0
      }));
    }
    if (fieldName === 'discovery_os') {
      const oss = ['iOS', 'Android', 'Windows', 'Linux', 'macOS'];
      return oss.map((c) => ({
        discovery_os: { name: c, label: c },
        download: direction === 'download' ? Math.floor(Math.random() * 30000000) + 5000000 : 0,
        upload: direction === 'upload' ? Math.floor(Math.random() * 10000000) + 1000000 : 0
      }));
    }
    if (fieldName === 'tls_version') {
      const vers = ['TLS 1.3', 'TLS 1.2', 'TLS 1.1'];
      return vers.map((c) => ({
        tls_version: { name: c, label: c },
        download: direction === 'download' ? Math.floor(Math.random() * 50000000) + 10000000 : 0,
        upload: direction === 'upload' ? Math.floor(Math.random() * 15000000) + 2000000 : 0
      }));
    }
    if (fieldName === 'tls_cipher') {
      const ciphers = ['TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305_SHA256', 'ECDHE-RSA-AES128-GCM-SHA256'];
      return ciphers.map((c) => ({
        tls_cipher: { name: c, label: c },
        download: direction === 'download' ? Math.floor(Math.random() * 40000000) + 10000000 : 0,
        upload: direction === 'upload' ? Math.floor(Math.random() * 12000000) + 2000000 : 0
      }));
    }
    if (fieldName === 'tls_security') {
      const secs = ['Modern (TLS 1.3)', 'Secure (TLS 1.2)', 'Weak'];
      return secs.map((c) => ({
        tls_security: { name: c, label: c, color: c === 'Weak' ? 'red' : 'green' },
        download: direction === 'download' ? Math.floor(Math.random() * 40000000) + 10000000 : 0,
        upload: direction === 'upload' ? Math.floor(Math.random() * 12000000) + 2000000 : 0
      }));
    }
    if (fieldName === 'netbios_hostname') {
      const hosts = ['DESKTOP-PC', 'NAS-SERVER', 'PRINTER-OFFICE'];
      return hosts.map((c) => ({
        netbios_hostname: { name: c, label: c },
        download: direction === 'download' ? Math.floor(Math.random() * 10000000) + 2000000 : 0,
        upload: direction === 'upload' ? Math.floor(Math.random() * 4000000) + 500000 : 0
      }));
    }
    if (fieldName === 'dhcp_class') {
      const classes = ['dhcpcd-9.4.1', 'MSFT 5.0', 'android-dhcp-10'];
      return classes.map((c) => ({
        dhcp_class: { name: c, label: c },
        download: direction === 'download' ? Math.floor(Math.random() * 20000000) + 5000000 : 0,
        upload: direction === 'upload' ? Math.floor(Math.random() * 5000000) + 1000000 : 0
      }));
    }
    if (fieldName === 'http_useragent') {
      const uas = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
      ];
      return uas.map((c) => ({
        http_useragent: { name: c, label: c },
        download: direction === 'download' ? Math.floor(Math.random() * 30000000) + 5000000 : 0,
        upload: direction === 'upload' ? Math.floor(Math.random() * 10000000) + 1000000 : 0
      }));
    }
    if (fieldName === 'https_sni_hostname') {
      const snis = ['*.google.com', '*.netflix.com', 'github.com', '*.facebook.com'];
      return snis.map((c) => ({
        https_sni_hostname: { name: c, label: c },
        download: direction === 'download' ? Math.floor(Math.random() * 30000000) + 5000000 : 0,
        upload: direction === 'upload' ? Math.floor(Math.random() * 10000000) + 1000000 : 0
      }));
    }
    if (fieldName === 'ssl_server_cn') {
      const cns = ['Google Internet Authority', 'DigiCert TLS RSA SHA256 2020 CA1', 'Let\'s Encrypt Authority X3'];
      return cns.map((c) => ({
        ssl_server_cn: { name: c, label: c },
        download: direction === 'download' ? Math.floor(Math.random() * 40000000) + 10000000 : 0,
        upload: direction === 'upload' ? Math.floor(Math.random() * 12000000) + 2000000 : 0
      }));
    }
    if (fieldName === 'quic_hostname') {
      const quics = ['*.google.com', '*.youtube.com', 'instagram.com'];
      return quics.map((c) => ({
        quic_hostname: { name: c, label: c },
        download: direction === 'download' ? Math.floor(Math.random() * 30000000) + 5000000 : 0,
        upload: direction === 'upload' ? Math.floor(Math.random() * 10000000) + 1000000 : 0
      }));
    }
    if (fieldName === 'bittorrent_info_hash') {
      const hashes = ['8f9e1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f', '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9e1a'];
      return hashes.map((c, i) => ({
        bittorrent_info_hash: { hash: c, label: `Torrent_${i+1}` },
        download: direction === 'download' ? Math.floor(Math.random() * 10000000) + 2000000 : 0,
        upload: direction === 'upload' ? Math.floor(Math.random() * 10000000) + 2000000 : 0
      }));
    }
    if (fieldName === 'ssh_client') {
      const clients = ['SSH-2.0-OpenSSH_8.2p1 Ubuntu-4ubuntu0.5', 'SSH-2.0-PuTTY_Release_0.76'];
      return clients.map((c) => ({
        ssh_client: { name: c, label: c },
        download: direction === 'download' ? Math.floor(Math.random() * 1000000) + 100000 : 0,
        upload: direction === 'upload' ? Math.floor(Math.random() * 500000) + 50000 : 0
      }));
    }
    if (fieldName === 'ssh_server') {
      const servers = ['SSH-2.0-OpenSSH_8.2p1 Ubuntu-4ubuntu0.5', 'SSH-2.0-dropbear_2019.78'];
      return servers.map((c) => ({
        ssh_server: { name: c, label: c },
        download: direction === 'download' ? Math.floor(Math.random() * 1000000) + 100000 : 0,
        upload: direction === 'upload' ? Math.floor(Math.random() * 500000) + 50000 : 0
      }));
    }
    if (fieldName === 'mdns_hostname') {
      const mdns = ['apple-tv.local', 'printer-office.local', 'nas-home.local'];
      return mdns.map((c) => ({
        mdns_hostname: { name: c, label: c },
        download: direction === 'download' ? Math.floor(Math.random() * 5000000) + 500000 : 0,
        upload: direction === 'upload' ? Math.floor(Math.random() * 2000000) + 200000 : 0
      }));
    }
  }
  return [];
}

async function netifyFetch(path, params = {}, useApiKey = false) {
  if (!JWT_TOKEN || !SITE_UUID || JWT_TOKEN === 'YOUR_JWT_TOKEN' || SITE_UUID === 'YOUR_SITE_UUID' || JWT_TOKEN.startsWith('change_me') || JWT_TOKEN.startsWith('YOUR_')) {
    return getMockDataForPath(path, params);
  }
  try {
    const res = await axios.get(`${BASE_URL}${path}`, {
      headers: headersSite(useApiKey), params, timeout: 30000,
    });
    const json = res.data;
    if (json?.status_code !== 0) {
      console.error(`[Netify] API Error ${json?.status_code} pada ${path}: ${json?.status_message}`);
      return getMockDataForPath(path, params);
    }
    return json?.data ?? null;
  } catch (err) {
    const s = err.response?.status;
    const msg = JSON.stringify(err.response?.data ?? err.message);
    console.error(`[Netify] ${s ?? 'ERR'} ${path}: ${msg}. Falling back to mock data.`);
    return getMockDataForPath(path, params);
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

// ─── PORT-TO-SERVICE MAPPING — untuk enrichment flows ────────────────────────
const PORT_SERVICE_MAP = {
  80: 'HTTP', 443: 'HTTPS / TLS', 8080: 'HTTP Alt', 8443: 'HTTPS Alt',
  53: 'DNS', 5353: 'mDNS', 853: 'DNS-over-TLS',
  25: 'SMTP', 587: 'SMTP TLS', 465: 'SMTPS', 110: 'POP3', 143: 'IMAP',
  22: 'SSH', 23: 'Telnet', 3389: 'RDP', 5900: 'VNC',
  21: 'FTP', 20: 'FTP Data', 989: 'FTPS', 990: 'FTPS Control',
  3306: 'MySQL', 5432: 'PostgreSQL', 6379: 'Redis', 27017: 'MongoDB',
  1194: 'OpenVPN', 51820: 'WireGuard', 500: 'IPSec IKE', 4500: 'IPSec NAT-T',
  1723: 'PPTP', 1701: 'L2TP',
  67: 'DHCP', 68: 'DHCP Client', 123: 'NTP',
  161: 'SNMP', 162: 'SNMP Trap', 514: 'Syslog',
  6881: 'BitTorrent', 6882: 'BitTorrent', 6883: 'BitTorrent',
  9993: 'ZeroTier VPN', 3478: 'STUN/TURN', 5004: 'RTP Media',
  5060: 'SIP', 5061: 'SIP TLS',
  8883: 'MQTT TLS', 1883: 'MQTT',
  179: 'BGP', 520: 'RIP',
};

// ─── FLOWS: endpoint /data/flows dengan enrichment app/domain ─────────────────
// NOTE: API flows tidak punya field app/domain — enrichment dilakukan via:
//   1. PORT_SERVICE_MAP (reliable, berdasarkan dst port)
//   2. tls_sni field (satu-satunya SNI field valid, tapi nilai sering kosong)
async function fetchFlows(limit = 500) {
  // Hanya fetch flows + tls_sni (satu-satunya SNI field yang valid = bukan 422)
  const [raw, tslSniRaw] = await Promise.all([
    netifyFetch('/data/flows', { settings_limit: limit }),
    netifyFetch('/data/stats/top/tls_sni/download', { filter_interval: 1440, settings_limit: 50 }),
  ]);

  if (!raw || !Array.isArray(raw)) return null;

  // Build TLS SNI lookup — filter yang tidak kosong
  const sniList = [];
  if (tslSniRaw && Array.isArray(tslSniRaw)) {
    for (const r of tslSniRaw) {
      const sni = r.tls_sni;
      if (sni && sni.trim() !== '') {
        sniList.push(sni.replace(/^\*\./, '').trim());
      }
    }
  }

  return raw.map(r => {
    const port = r.remote_port ?? null;
    // Primary enrichment: port → service name
    const portService = port ? (PORT_SERVICE_MAP[port] ?? `Port ${port}`) : null;

    let domain = null;
    let appLabel = portService;

    // Secondary enrichment: for HTTPS flows, use SNI list if available
    if ((port === 443 || port === 8443) && sniList.length > 0) {
      domain = sniList[0];
    }

    return {
      flow_id    : String(r.flow_id ?? ''),
      src_ip     : r.local_ip?.address  ?? null,
      src_mac    : r.local_mac          ?? r.mac?.address ?? null,
      dst_ip     : r.remote_ip?.address ?? null,
      dst_port   : port,
      protocol   : r.ip_protocol?.label ?? null,
      app_label  : appLabel,
      domain     : domain,
      download   : r.download ?? 0,
      upload     : r.upload   ?? 0,
      first_seen : r.first_seen_at?.date ?? null,
      last_seen  : r.last_seen_at?.date  ?? null,
    };
  });
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

// ─── DNS/HOSTNAME — gunakan tls_sni karena hostname endpoint timeout ──────────
async function fetchTopDomains(interval = 1440, limit = 50) {
  // NOTE: /data/stats/top/hostname/download selalu timeout
  // Gunakan tls_sni yang confirmed bekerja di API ini
  const raw = await netifyFetch('/data/stats/top/tls_sni/download', {
    filter_interval: interval, settings_limit: limit,
  });
  if (!raw) return null;

  return raw
    .filter(r => r.tls_sni && r.tls_sni.trim() !== '')
    .map(r => ({
      domain      : r.tls_sni.replace(/^\*\./, '').trim(),
      app_label   : null,
      category    : 'HTTPS/TLS',
      download    : r.download ?? 0,
      query_count : r.download ?? 0,
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
  // Ambil lebih banyak bandwidth data (limit x2) supaya coverage IP lebih luas
  const [intelRaw, dlData, ulData, flowsRaw] = await Promise.all([
    netifyFetch('/intelligence/discovery/devices', { settings_limit: limit }),
    netifyFetch('/data/stats/top/local_ip/download', { filter_interval: interval, settings_limit: limit }),
    netifyFetch('/data/stats/top/local_ip/upload',   { filter_interval: interval, settings_limit: limit }),
    netifyFetch('/data/flows', { settings_limit: 500 }),
  ]);

  if (!intelRaw || !Array.isArray(intelRaw)) return [];

  // Map bandwidth per IP
  const dlMap = {};
  const ulMap = {};
  if (dlData) {
    for (const r of dlData) {
      const ip = r.local_ip?.address ?? String(r.local_ip);
      if (ip) dlMap[ip] = r.download ?? 0;
    }
  }
  if (ulData) {
    for (const r of ulData) {
      const ip = r.local_ip?.address ?? String(r.local_ip);
      if (ip) ulMap[ip] = r.upload ?? 0;
    }
  }

  // Enrich bandwidth from flows — aggregate per local_ip as fallback
  // Bagi device yang IP-nya tidak ada di top stats (traffic kecil)
  const dlFlowMap = {};
  const ulFlowMap = {};
  if (flowsRaw && Array.isArray(flowsRaw)) {
    for (const f of flowsRaw) {
      const ip = f.local_ip?.address;
      if (!ip) continue;
      if (!dlMap[ip]) {
        dlFlowMap[ip] = (dlFlowMap[ip] ?? 0) + (f.download ?? 0);
      }
      if (!ulMap[ip]) {
        ulFlowMap[ip] = (ulFlowMap[ip] ?? 0) + (f.upload ?? 0);
      }
    }
  }

  return intelRaw.map(r => {
    const ip = r.ip?.address ?? null;
    const mac = r.mac_address ?? r.discovery_mac?.address ?? null;
    const oui = mac ? mac.substring(0, 8).toUpperCase() : null;
    const mfr = r.mac_vendor !== 'Unknown' && r.mac_vendor !== 'Local' ? r.mac_vendor : (OUI_MAP[oui] ?? r.mac_vendor ?? null);

    // Get device_type — prefer discovery_type if meaningful, else device_type
    const rawType = r.discovery_type?.label;
    const deviceType = (rawType && rawType !== 'Unknown' && rawType !== 'Unclassified')
      ? rawType
      : (r.device_type?.label && r.device_type.label !== 'Unclassified' ? r.device_type.label : rawType ?? null);

    // Get OS — prefer discovery_os if meaningful, else device_os
    const rawOs = r.discovery_os?.label;
    const osLabel = (rawOs && rawOs !== 'Unknown' && rawOs !== 'Unclassified')
      ? rawOs
      : (r.device_os?.label && r.device_os.label !== 'Unclassified' ? r.device_os.label : rawOs ?? null);

    // Bandwidth: prioritize top stats, fallback to flows aggregation
    const dl = ip ? (dlMap[ip] ?? dlFlowMap[ip] ?? 0) : 0;
    const ul = ip ? (ulMap[ip] ?? ulFlowMap[ip] ?? 0) : 0;

    return {
      ip_address   : ip,
      mac_address  : mac,
      device_label : r.device?.label || r.discovery_mac?.discovery_hardware || ip || 'Unknown',
      device_type  : deviceType,
      os_label     : osLabel,
      manufacturer : mfr,
      download     : dl,
      upload       : ul,
      last_seen    : r.last_seen_at?.date || r.discovery_mac?.last_seen_at?.date || null,
    };
  }).sort((a, b) => (b.download + b.upload) - (a.download + a.upload));
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
  if (!JWT_TOKEN || !SITE_UUID || JWT_TOKEN === 'YOUR_JWT_TOKEN' || SITE_UUID === 'YOUR_SITE_UUID' || JWT_TOKEN.startsWith('change_me') || JWT_TOKEN.startsWith('YOUR_')) {
    return {
      applications: [
        { id: 1, label: 'YouTube', tag: 'video', category: { label: 'Streaming' } },
        { id: 2, label: 'Netflix', tag: 'video', category: { label: 'Streaming' } },
        { id: 3, label: 'Web Browsing', tag: 'web', category: { label: 'General' } },
        { id: 4, label: 'Google Services', tag: 'google', category: { label: 'Tech' } },
        { id: 5, label: 'WhatsApp', tag: 'im', category: { label: 'Chat' } }
      ],
      pagination: { total_records: 5, current_page: 1, total_pages: 1 }
    };
  }
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

// ─── DETAIL FETCHERS FOR INTERACTIVE MODALS (DB-BASED — API ignores filter params) ─────────
//
// NOTE: Netify Informatics API does NOT filter by filter_agent / filter_local_ip —
// all filter params are silently ignored and global data is returned.
// All detail queries therefore use the local SQLite DB (flows, devices tables).
//
// Agent ↔ src_mac mapping (determined empirically from flows data):
//   2F-TF-1D-GK (JRP Cibubur)  → src_mac '60:be:b4:1f:05:96'  (IPs 10.1.x.x, 10.0.x.x)
//   8A-V3-PB-85 (IFG LT.18)    → src_mac '04:f4:1c:ce:c2:e6'  (IPs 10.6.x.x, 192.168.9.x)
//   F6-2V-DT-8A (CPI Balaraja) → src_mac '2c:7b:a0:d8:86:91', '16:11:ac:73:34:1d', etc (IPs 10.250.x.x)

const AGENT_LABELS = {
  '2F-TF-1D-GK': 'JRP Cibubur',
  '8A-V3-PB-85': 'IFG LT.18',
  'F6-2V-DT-8A': 'CPI Balaraja',
};

// Maps each agent UUID to its gateway/interface MAC address(es) in flows
const AGENT_MAC_MAP = {
  '2F-TF-1D-GK': ['60:be:b4:1f:05:96'],
  '8A-V3-PB-85': ['04:f4:1c:ce:c2:e6'],
  'F6-2V-DT-8A': ['2c:7b:a0:d8:86:91', '16:11:ac:73:34:1d', 'bc:45:5b:ca:d5:be',
                   'de:ed:cc:57:58:34', 'f4:6d:3f:ef:01:a0', '60:be:b4:29:d3:36'],
};

// Build SQL IN clause placeholders
function inClause(arr) {
  return arr.map(() => '?').join(',');
}

// Fetch all data for a specific agent (by UUID) — from local DB flows
async function fetchAgentDetails(agentUuid) {
  const db = require('./database');
  const d  = db.getDB();

  const label = AGENT_LABELS[agentUuid] || agentUuid;
  const macs  = AGENT_MAC_MAP[agentUuid];

  const emptyResult = { agent_uuid: agentUuid, agent_label: label, summary: null, devices: [], flows: [], top_apps: [], security: { encryption_audit: [], insecure_protocols: [], unencrypted_passwords: [], ip_reputation: [], tor_detections: [], vpn_detections: [] }, events: [], mac_bandwidth: [], server_discovery: [] };

  if (!macs || macs.length === 0) return emptyResult;

  const ph = inClause(macs);

  // ── 1. Top apps by this agent (from flows) ─────────────────────────────────
  const appRows = d.prepare(`
    SELECT app_label,
           SUM(bytes_download) AS download,
           SUM(bytes_upload)   AS upload,
           COUNT(*)            AS flow_count
    FROM   flows
    WHERE  src_mac IN (${ph})
      AND  app_label IS NOT NULL
    GROUP  BY app_label
    ORDER  BY download DESC
    LIMIT  15
  `).all(...macs);

  const top_apps = appRows.map(r => ({
    app_id    : null,
    app_label : r.app_label,
    category  : null,
    favicon   : null,
    download  : r.download ?? 0,
    upload    : r.upload   ?? 0,
  }));

  // ── 2. Distinct devices for this agent ─────────────────────────────────────
  const devRows = d.prepare(`
    SELECT f.src_ip       AS ip_address,
           f.src_mac      AS mac_address,
           d.device_label,
           d.device_type,
           d.os_label,
           d.manufacturer,
           SUM(f.bytes_download) AS dl,
           SUM(f.bytes_upload)   AS ul,
           MAX(f.last_seen) AS last_seen
    FROM   flows f
    LEFT JOIN (
      SELECT ip_address, device_label, device_type, os_label, manufacturer
      FROM   devices
      GROUP  BY ip_address
    ) d ON d.ip_address = f.src_ip
    WHERE  f.src_mac IN (${ph})
    GROUP  BY f.src_ip
    ORDER  BY dl DESC
    LIMIT  100
  `).all(...macs);

  const agentIPs = [...new Set(devRows.map(r => r.ip_address).filter(Boolean))];
  const phIPs    = agentIPs.length > 0 ? agentIPs.map(() => '?').join(',') : null;

  const latestEncAudit = d.prepare(`SELECT MAX(fetched_at) AS t FROM intel_encryption_audit`).get()?.t;
  const riskMap = {};
  if (latestEncAudit) {
    const riskRows = d.prepare(`SELECT ip_address, encrypted_pct, risk_level FROM intel_encryption_audit WHERE fetched_at = ?`).all(latestEncAudit);
    for (const r of riskRows) {
      if (r.ip_address) riskMap[r.ip_address] = { encrypted_pct: r.encrypted_pct, risk_level: r.risk_level };
    }
  }

  const insecureIPs = new Set(
    phIPs ? d.prepare(`SELECT DISTINCT ip_address FROM intel_insecure_protocols WHERE ip_address IN (${phIPs})`).all(...agentIPs).map(r => r.ip_address) : []
  );

  const devices = devRows.map(r => ({
    ip_address   : r.ip_address,
    mac_address  : r.mac_address,
    device_label : r.device_label || r.ip_address || 'Unknown',
    device_type  : r.device_type  || null,
    os_label     : r.os_label     || null,
    manufacturer : r.manufacturer || null,
    last_seen    : r.last_seen    || null,
    download     : r.dl ?? 0,
    upload       : r.ul ?? 0,
    encrypted_pct: riskMap[r.ip_address]?.encrypted_pct ?? null,
    risk_level   : riskMap[r.ip_address]?.risk_level    ?? null,
    has_insecure : insecureIPs.has(r.ip_address),
  }));

  // ── 3. Recent flows for this agent ─────────────────────────────────────────
  const flowRows = d.prepare(`
    SELECT src_ip, dst_ip, dst_port, protocol, app_label, domain,
           bytes_download AS download, bytes_upload AS upload, last_seen
    FROM   flows
    WHERE  src_mac IN (${ph})
    ORDER  BY last_seen DESC
    LIMIT  100
  `).all(...macs);

  const flows = flowRows.map(r => ({
    src_ip    : r.src_ip,
    dst_ip    : r.dst_ip,
    dst_port  : r.dst_port,
    protocol  : r.protocol,
    app_label : r.app_label,
    domain    : r.domain,
    download  : r.download ?? 0,
    upload    : r.upload   ?? 0,
    last_seen : r.last_seen,
  }));

  // ── 4. Summary stats ────────────────────────────────────────────────────────
  const sumRow = d.prepare(`
    SELECT COUNT(DISTINCT src_ip) AS device_count,
           COUNT(*) AS flow_count,
           SUM(bytes_download) AS total_download,
           SUM(bytes_upload)   AS total_upload
    FROM   flows
    WHERE  src_mac IN (${ph})
  `).get(...macs);

  const summary = sumRow ? {
    total_devices  : sumRow.device_count  ?? 0,
    active_flows   : sumRow.flow_count    ?? 0,
    bandwidth_down : sumRow.total_download ?? 0,
    bandwidth_up   : sumRow.total_upload  ?? 0,
  } : null;

  // ── 5. Security Intel filtered by agent IPs & MACs ─────────────────────────
  const encryptionRows = (latestEncAudit && phIPs)
    ? d.prepare(`SELECT ip_address, mac_address, device_label, encrypted_pct, unencrypted, encrypted, total, risk_level, detected_at FROM intel_encryption_audit WHERE fetched_at = ? AND ip_address IN (${phIPs}) ORDER BY CASE risk_level WHEN 'Rawan' THEN 1 WHEN 'Sedang' THEN 2 ELSE 3 END`).all(latestEncAudit, ...agentIPs)
    : [];

  const insecureProtoRows = phIPs
    ? d.prepare(`SELECT ip_address, mac_address, protocol, risk, app_label, dst_ip, dst_port, download, upload, detected_at FROM intel_insecure_protocols WHERE ip_address IN (${phIPs}) ORDER BY detected_at DESC LIMIT 50`).all(...agentIPs)
    : [];

  let unencPwdRows = d.prepare(`SELECT ip_address, mac_address, dst_ip, dst_port, protocol, username, severity, download, upload, detected_at FROM intel_unencrypted_passwords WHERE mac_address IN (${ph}) ORDER BY detected_at DESC LIMIT 50`).all(...macs);
  if (unencPwdRows.length === 0 && phIPs) {
    unencPwdRows = d.prepare(`SELECT ip_address, mac_address, dst_ip, dst_port, protocol, username, severity, download, upload, detected_at FROM intel_unencrypted_passwords WHERE ip_address IN (${phIPs}) ORDER BY detected_at DESC LIMIT 50`).all(...agentIPs);
  }

  const latestRepSnap = d.prepare(`SELECT MAX(fetched_at) AS t FROM intel_ip_reputation`).get()?.t;
  const ipReputRows = (latestRepSnap && phIPs)
    ? d.prepare(`SELECT ip_address, local_ip, mac_address, reputation, score, country, app_label, blacklisted, download, upload, detected_at FROM intel_ip_reputation WHERE fetched_at = ? AND (local_ip IN (${phIPs}) OR ip_address IN (${phIPs})) ORDER BY score DESC LIMIT 50`).all(latestRepSnap, ...agentIPs, ...agentIPs)
    : [];

  let torRows = d.prepare(`SELECT ip_address, mac_address, exit_node, circuit_id, country, download, upload, detected_at FROM intel_tor_detection WHERE mac_address IN (${ph}) ORDER BY detected_at DESC LIMIT 20`).all(...macs);
  if (torRows.length === 0 && phIPs) {
    torRows = d.prepare(`SELECT ip_address, mac_address, exit_node, circuit_id, country, download, upload, detected_at FROM intel_tor_detection WHERE ip_address IN (${phIPs}) ORDER BY detected_at DESC LIMIT 20`).all(...agentIPs);
  }

  let vpnRows = d.prepare(`SELECT ip_address, mac_address, vpn_type, remote_ip, protocol, country, confidence, download, upload, detected_at FROM intel_vpn_detection WHERE mac_address IN (${ph}) ORDER BY detected_at DESC LIMIT 20`).all(...macs);
  if (vpnRows.length === 0 && phIPs) {
    vpnRows = d.prepare(`SELECT ip_address, mac_address, vpn_type, remote_ip, protocol, country, confidence, download, upload, detected_at FROM intel_vpn_detection WHERE ip_address IN (${phIPs}) ORDER BY detected_at DESC LIMIT 20`).all(...agentIPs);
  }

  const serverDiscRows = phIPs
    ? d.prepare(`SELECT ip_address, mac_address, server_type, hostname, port, protocol, os_label, download, upload, detected_at FROM intel_server_discovery WHERE ip_address IN (${phIPs}) ORDER BY detected_at DESC LIMIT 50`).all(...agentIPs)
    : [];

  const security = {
    encryption_audit     : encryptionRows,
    insecure_protocols   : insecureProtoRows,
    unencrypted_passwords: unencPwdRows,
    ip_reputation        : ipReputRows,
    tor_detections       : torRows,
    vpn_detections       : vpnRows,
  };

  // ── 6. Events filtered by agent IPs & MACs ─────────────────────────────────
  const eventsByIP  = phIPs ? d.prepare(`SELECT event_id, event_type, severity, ip_address, mac_address, description, event_at FROM events WHERE ip_address IN (${phIPs}) ORDER BY event_at DESC LIMIT 100`).all(...agentIPs) : [];
  const eventsByMAC = d.prepare(`SELECT event_id, event_type, severity, ip_address, mac_address, description, event_at FROM events WHERE mac_address IN (${ph}) ORDER BY event_at DESC LIMIT 100`).all(...macs);

  const seenEvt = new Set();
  const allEvents = [];
  for (const r of [...eventsByIP, ...eventsByMAC]) {
    const key = r.event_id || `${r.ip_address}:${r.event_at}`;
    if (!seenEvt.has(key)) {
      seenEvt.add(key);
      allEvents.push({ event_id: r.event_id, event_type: r.event_type, severity: r.severity, ip_address: r.ip_address, mac_address: r.mac_address, description: r.description, event_at: r.event_at });
    }
  }
  allEvents.sort((a, b) => (b.event_at || '').localeCompare(a.event_at || ''));
  const events = allEvents.slice(0, 100);

  // ── 7. MAC bandwidth for this agent's MACs ──────────────────────────────────
  const latestMacSnap = d.prepare(`SELECT MAX(fetched_at) AS t FROM mac_bandwidth`).get()?.t;
  const mac_bandwidth = latestMacSnap
    ? d.prepare(`SELECT mac_address, manufacturer, download, upload, total FROM mac_bandwidth WHERE fetched_at = ? AND mac_address IN (${ph}) ORDER BY download DESC`).all(latestMacSnap, ...macs)
    : [];

  return {
    agent_uuid      : agentUuid,
    agent_label     : label,
    summary,
    devices,
    flows,
    top_apps,
    security,
    events,
    mac_bandwidth,
    server_discovery: serverDiscRows,
  };
}

// Fetch data for a specific device IP — from local DB (all 10 correlated tables)
async function fetchDeviceDetails(ip) {
  const db = require('./database');
  const d  = db.getDB();

  // ── 0. Resolve MAC from flows (most recent) ──────────────────────────────
  const macRow = d.prepare(`SELECT src_mac FROM flows WHERE src_ip = ? AND src_mac IS NOT NULL ORDER BY last_seen DESC LIMIT 1`).get(ip);
  const mac = macRow?.src_mac || null;

  // ── 1. Device info from devices table ────────────────────────────────────
  const deviceRow = d.prepare(`
    SELECT device_label, device_type, os_label, manufacturer, download, upload, last_seen
    FROM   devices
    WHERE  ip_address = ?
    ORDER  BY fetched_at DESC
    LIMIT  1
  `).get(ip);

  // ── 2. Discovery info (may differ from devices table) ────────────────────
  const discRow = d.prepare(`
    SELECT device_type, os_label, manufacturer, device_label, is_new
    FROM   intel_device_discovery
    WHERE  ip_address = ?
    ORDER  BY fetched_at DESC
    LIMIT  1
  `).get(ip);

  const device_info = {
    device_label : deviceRow?.device_label || discRow?.device_label || null,
    device_type  : deviceRow?.device_type  || discRow?.device_type  || null,
    os_label     : deviceRow?.os_label     || discRow?.os_label     || null,
    manufacturer : deviceRow?.manufacturer || discRow?.manufacturer || null,
    mac_address  : mac,
    is_new       : discRow?.is_new ?? null,
  };

  // ── 3. Named apps (exclude "Port XXX" port-only entries) ─────────────────
  const namedAppRows = d.prepare(`
    SELECT app_label,
           SUM(bytes_download) AS download,
           SUM(bytes_upload)   AS upload,
           COUNT(*)            AS flow_count
    FROM   flows
    WHERE  src_ip = ?
      AND  app_label IS NOT NULL
      AND  app_label NOT LIKE 'Port %'
    GROUP  BY app_label
    ORDER  BY download DESC
    LIMIT  20
  `).all(ip);

  // ── 4. Top domains accessed by this device ─────────────────────────────
  const domainRows = d.prepare(`
    SELECT domain,
           -- use app_label that appeared most with this domain
           (SELECT app_label FROM flows
            WHERE src_ip = f.src_ip AND domain = f.domain
              AND app_label IS NOT NULL
            ORDER BY bytes_download DESC LIMIT 1) AS app_label,
           -- extract root domain for display
           domain AS display_name,
           SUM(bytes_download) AS download,
           SUM(bytes_upload)   AS upload,
           COUNT(*)            AS flow_count
    FROM   flows f
    WHERE  src_ip = ?
      AND  domain IS NOT NULL
    GROUP  BY domain
    ORDER  BY download DESC
    LIMIT  30
  `).all(ip);

  // ── 5. Smart combined: flows with BOTH domain and app_label, or just one ─
  // Build combined display list:
  // Priority 1 = rows with actual domain (show domain as label)
  // Priority 2 = rows with named app (not port-only)
  // Merge & de-duplicate by display name
  const combinedMap = new Map();

  // Add domains first (higher priority)
  for (const r of domainRows) {
    combinedMap.set('domain:' + r.domain, {
      label      : r.domain,          // the actual website/domain
      sub_label  : r.app_label || null, // protocol (HTTPS/TLS etc)
      type       : 'domain',
      download   : r.download ?? 0,
      upload     : r.upload   ?? 0,
      flow_count : r.flow_count,
    });
  }

  // Add named apps that don't duplicate a domain entry
  for (const r of namedAppRows) {
    const key = 'app:' + r.app_label;
    if (!combinedMap.has(key)) {
      combinedMap.set(key, {
        label      : r.app_label,  // protocol name (DNS, HTTPS/TLS, etc)
        sub_label  : null,
        type       : 'protocol',
        download   : r.download ?? 0,
        upload     : r.upload   ?? 0,
        flow_count : r.flow_count,
      });
    }
  }

  // If neither domain nor named app found, fall back to ALL app_labels incl Port XXX
  const top_apps = combinedMap.size > 0
    ? [...combinedMap.values()].sort((a, b) => b.download - a.download).slice(0, 25)
    : d.prepare(`
        SELECT app_label AS label, NULL AS sub_label, 'port' AS type,
               SUM(bytes_download) AS download, SUM(bytes_upload) AS upload, COUNT(*) AS flow_count
        FROM   flows WHERE src_ip = ? AND app_label IS NOT NULL
        GROUP  BY app_label ORDER BY download DESC LIMIT 25
      `).all(ip).map(r => ({ label: r.label, sub_label: null, type: 'port', download: r.download ?? 0, upload: r.upload ?? 0, flow_count: r.flow_count }));

  // top_domains: keep simple list for Info tab
  const top_domains = domainRows.map(r => ({
    domain     : r.domain,
    app_label  : r.app_label,
    download   : r.download ?? 0,
    upload     : r.upload   ?? 0,
    flow_count : r.flow_count,
  }));

  // ── 5. Recent flows ────────────────────────────────────────────────────
  const flowRows = d.prepare(`
    SELECT dst_ip, dst_port, protocol, app_label, domain,
           bytes_download AS download, bytes_upload AS upload, last_seen
    FROM   flows
    WHERE  src_ip = ?
    ORDER  BY last_seen DESC
    LIMIT  100
  `).all(ip);

  const flows = flowRows.map(r => ({
    dst_ip    : r.dst_ip,
    dst_port  : r.dst_port,
    protocol  : r.protocol,
    app_label : r.app_label,
    domain    : r.domain,
    download  : r.download ?? 0,
    upload    : r.upload   ?? 0,
    last_seen : r.last_seen,
  }));

  // ── 6. Totals ─────────────────────────────────────────────────────────
  const sumRow = d.prepare(`
    SELECT SUM(bytes_download) AS total_download,
           SUM(bytes_upload)   AS total_upload,
           COUNT(*) AS flow_count
    FROM   flows
    WHERE  src_ip = ?
  `).get(ip);

  // ── 7. Encryption audit (latest snapshot) ─────────────────────────────
  const latestAudit = d.prepare(`SELECT MAX(fetched_at) AS t FROM intel_encryption_audit`).get()?.t;
  const encRow = latestAudit
    ? d.prepare(`
        SELECT encrypted_pct, encrypted, unencrypted, total, risk_level, mac_address
        FROM   intel_encryption_audit
        WHERE  fetched_at = ? AND ip_address = ?
        LIMIT  1
      `).get(latestAudit, ip)
    : null;

  // Also try fallback by MAC if not found by IP
  const encRowMac = (!encRow && mac && latestAudit)
    ? d.prepare(`
        SELECT encrypted_pct, encrypted, unencrypted, total, risk_level, ip_address
        FROM   intel_encryption_audit
        WHERE  fetched_at = ? AND mac_address = ?
        ORDER  BY detected_at DESC
        LIMIT  1
      `).get(latestAudit, mac)
    : null;

  const encFinal = encRow || encRowMac;

  const encryption = encFinal ? {
    encrypted_pct   : encFinal.encrypted_pct   ?? null,
    encrypted_bytes : encFinal.encrypted        ?? null,
    unencrypted_bytes: encFinal.unencrypted     ?? null,
    total_bytes     : encFinal.total            ?? null,
    risk_level      : encFinal.risk_level       ?? null,
  } : null;

  // ── 8. Server discovery (servers this device accessed) ─────────────────
  const serverRows = d.prepare(`
    SELECT DISTINCT server_type, hostname, port, protocol, os_label,
           MAX(download) AS download, MAX(upload) AS upload, MAX(detected_at) AS detected_at
    FROM   intel_server_discovery
    WHERE  ip_address = ?
    GROUP  BY server_type, port, protocol
    ORDER  BY download DESC
    LIMIT  50
  `).all(ip);

  // fallback by MAC if no rows by IP
  const serverRowsMac = (serverRows.length === 0 && mac)
    ? d.prepare(`
        SELECT DISTINCT server_type, hostname, port, protocol, os_label,
               MAX(download) AS download, MAX(upload) AS upload, MAX(detected_at) AS detected_at
        FROM   intel_server_discovery
        WHERE  mac_address = ?
        GROUP  BY server_type, port, protocol
        ORDER  BY download DESC
        LIMIT  50
      `).all(mac)
    : [];

  const server_discovery = (serverRows.length > 0 ? serverRows : serverRowsMac).map(r => ({
    server_type : r.server_type,
    hostname    : r.hostname || null,
    port        : r.port,
    protocol    : r.protocol,
    os_label    : r.os_label || null,
    download    : r.download ?? 0,
    upload      : r.upload   ?? 0,
    detected_at : r.detected_at,
  }));

  // ── 9. Unencrypted passwords ───────────────────────────────────────────
  let pwdRows = d.prepare(`
    SELECT dst_ip, dst_port, protocol, username, severity, download, upload, detected_at
    FROM   intel_unencrypted_passwords
    WHERE  ip_address = ?
    ORDER  BY detected_at DESC
    LIMIT  50
  `).all(ip);

  if (pwdRows.length === 0 && mac) {
    pwdRows = d.prepare(`
      SELECT dst_ip, dst_port, protocol, username, severity, download, upload, detected_at
      FROM   intel_unencrypted_passwords
      WHERE  mac_address = ?
      ORDER  BY detected_at DESC
      LIMIT  50
    `).all(mac);
  }

  const unencrypted_passwords = pwdRows.map(r => ({
    dst_ip      : r.dst_ip,
    dst_port    : r.dst_port,
    protocol    : r.protocol,
    username    : r.username,
    severity    : r.severity,
    download    : r.download ?? 0,
    upload      : r.upload   ?? 0,
    detected_at : r.detected_at,
  }));

  // ── 10. IP Reputation (latest snapshot, this device's local_ip) ─────────
  const latestRepSnap = d.prepare(`SELECT MAX(fetched_at) AS t FROM intel_ip_reputation`).get()?.t;
  const repRows = latestRepSnap
    ? d.prepare(`
        SELECT ip_address, local_ip, reputation, score, country, app_label, blacklisted, download, upload
        FROM   intel_ip_reputation
        WHERE  fetched_at = ? AND (local_ip = ? OR ip_address = ?)
        ORDER  BY score DESC NULLS LAST
        LIMIT  30
      `).all(latestRepSnap, ip, ip)
    : [];

  const ip_reputation = repRows.map(r => ({
    remote_ip   : r.ip_address,
    local_ip    : r.local_ip,
    reputation  : r.reputation,
    score       : r.score,
    country     : r.country,
    app_label   : r.app_label,
    blacklisted : !!r.blacklisted,
    download    : r.download ?? 0,
    upload      : r.upload   ?? 0,
  }));

  // ── 11. VPN detection ─────────────────────────────────────────────────
  let vpnRows = d.prepare(`
    SELECT vpn_type, remote_ip, protocol, country, confidence, download, upload, detected_at
    FROM   intel_vpn_detection
    WHERE  ip_address = ?
    ORDER  BY detected_at DESC
    LIMIT  20
  `).all(ip);

  if (vpnRows.length === 0 && mac) {
    vpnRows = d.prepare(`
      SELECT vpn_type, remote_ip, protocol, country, confidence, download, upload, detected_at
      FROM   intel_vpn_detection
      WHERE  mac_address = ?
      ORDER  BY detected_at DESC
      LIMIT  20
    `).all(mac);
  }

  const vpn_detections = vpnRows.map(r => ({
    vpn_type    : r.vpn_type,
    remote_ip   : r.remote_ip,
    protocol    : r.protocol,
    country     : r.country,
    confidence  : r.confidence,
    download    : r.download ?? 0,
    upload      : r.upload   ?? 0,
    detected_at : r.detected_at,
  }));

  // ── 12. Events ────────────────────────────────────────────────────────
  const evtByIP  = d.prepare(`SELECT event_type, severity, ip_address, mac_address, description, event_at FROM events WHERE ip_address = ? ORDER BY event_at DESC LIMIT 50`).all(ip);
  const evtByMAC = mac ? d.prepare(`SELECT event_type, severity, ip_address, mac_address, description, event_at FROM events WHERE mac_address = ? ORDER BY event_at DESC LIMIT 50`).all(mac) : [];

  const seenEvt = new Set();
  const evtMerged = [];
  for (const r of [...evtByIP, ...evtByMAC]) {
    const key = `${r.event_type}:${r.event_at}`;
    if (!seenEvt.has(key)) {
      seenEvt.add(key);
      evtMerged.push({ event_type: r.event_type, severity: r.severity, ip_address: r.ip_address, mac_address: r.mac_address, description: r.description, event_at: r.event_at });
    }
  }
  evtMerged.sort((a, b) => (b.event_at || '').localeCompare(a.event_at || ''));
  const events = evtMerged.slice(0, 100);

  // ── 13. MAC bandwidth (latest snapshot) ───────────────────────────────
  const latestMacSnap = d.prepare(`SELECT MAX(fetched_at) AS t FROM mac_bandwidth`).get()?.t;
  const macBwRow = (latestMacSnap && mac)
    ? d.prepare(`SELECT manufacturer, download, upload, total FROM mac_bandwidth WHERE fetched_at = ? AND mac_address = ? LIMIT 1`).get(latestMacSnap, mac)
    : null;

  const mac_bandwidth = macBwRow ? {
    mac_address  : mac,
    manufacturer : macBwRow.manufacturer,
    download     : macBwRow.download ?? 0,
    upload       : macBwRow.upload   ?? 0,
    total        : macBwRow.total    ?? 0,
  } : null;

  return {
    ip,
    mac_address    : mac,
    total_download : deviceRow?.download || sumRow?.total_download || 0,
    total_upload   : deviceRow?.upload || sumRow?.total_upload || 0,
    flow_count     : sumRow?.flow_count     ?? 0,
    device_info,
    top_apps,
    top_domains    : domainRows.map(r => ({ domain: r.domain, download: r.download ?? 0, upload: r.upload ?? 0, flow_count: r.flow_count })),
    flows,
    encryption,
    server_discovery,
    unencrypted_passwords,
    ip_reputation,
    vpn_detections,
    events,
    mac_bandwidth,
  };
}

// Fetch data for a specific application// Fetch data for a specific application — from local DB
async function fetchAppDetails(appLabel) {
  const db = require('./database');
  const d  = db.getDB();

  // ── Totals: from flows (protocol-level) OR bandwidth_apps (brand-level) ──
  // IMPORTANT: use MAX(download) from latest snapshot — NOT SUM() of all history!
  const flowTotalRow = d.prepare(`
    SELECT SUM(bytes_download) AS download,
           SUM(bytes_upload)   AS upload,
           COUNT(*) AS flow_count
    FROM   flows
    WHERE  app_label = ?
  `).get(appLabel);

  let total_download = flowTotalRow?.download ?? 0;
  let total_upload   = flowTotalRow?.upload   ?? 0;
  let data_source    = 'flows'; // track where totals came from

  // If no flows data (brand-name app like YouTube), use LATEST bandwidth_apps snapshot
  if (total_download === 0 && total_upload === 0) {
    const latestSnap = d.prepare(`SELECT MAX(fetched_at) AS t FROM bandwidth_apps WHERE app_label = ?`).get(appLabel)?.t;
    if (latestSnap) {
      const bwRow = d.prepare(`
        SELECT download, upload
        FROM   bandwidth_apps
        WHERE  app_label = ? AND fetched_at = ?
        LIMIT  1
      `).get(appLabel, latestSnap);
      if (bwRow) {
        total_download = bwRow.download ?? 0;
        total_upload   = bwRow.upload   ?? 0;
        data_source    = 'bandwidth_apps';
      }
    }
  }

  // ── Top IPs accessing this app (from flows — protocol-level labels) ──
  const ipRows = d.prepare(`
    SELECT src_ip AS ip_address,
           SUM(bytes_download) AS download,
           SUM(bytes_upload)   AS upload,
           COUNT(*) AS flow_count
    FROM   flows
    WHERE  app_label = ?
    GROUP  BY src_ip
    ORDER  BY download DESC
    LIMIT  20
  `).all(appLabel);

  // ── Domain-based per-IP breakdown (bridges HTTPS/TLS → brand name) ──
  // Build keyword map for common brand names
  const DOMAIN_KEYWORDS = {
    'YouTube'   : ['youtube', 'googlevideo', 'ytimg', 'yt3.ggpht'],
    'Facebook'  : ['facebook', 'fbcdn', 'fb.com', 'fbsbx'],
    'WhatsApp'  : ['whatsapp', 'wa.me'],
    'Instagram' : ['instagram', 'cdninstagram'],
    'TikTok'    : ['tiktok', 'tiktokcdn', 'tiktokv'],
    'Netflix'   : ['netflix', 'nflxvideo', 'nflximg'],
    'Google'    : ['google.com', 'googleapis', 'gstatic', 'googlesyndication'],
    'Microsoft' : ['microsoft', 'msftncsi', 'live.com', 'office365', 'sharepoint'],
    'Zoom'      : ['zoom.us', 'zoomgov'],
    'Spotify'   : ['spotify', 'scdn.co'],
  };

  let domain_breakdown = [];
  const kws = DOMAIN_KEYWORDS[appLabel];
  if (kws && kws.length > 0) {
    // Build WHERE clause for domain keywords
    const likeClause = kws.map(() => `LOWER(domain) LIKE ?`).join(' OR ');
    const likeParams = kws.map(k => `%${k}%`);
    const domRows = d.prepare(`
      SELECT src_ip AS ip_address,
             SUM(bytes_download) AS download,
             SUM(bytes_upload)   AS upload,
             COUNT(*) AS flow_count
      FROM   flows
      WHERE  domain IS NOT NULL AND (${likeClause})
      GROUP  BY src_ip
      ORDER  BY download DESC
      LIMIT  20
    `).all(...likeParams);
    domain_breakdown = domRows.map(r => ({
      ip_address : r.ip_address,
      download   : r.download ?? 0,
      upload     : r.upload   ?? 0,
      flow_count : r.flow_count ?? 0,
    }));
  }

  // ── Threat flags: cross-reference top IPs with intel_ip_reputation ──
  const latestRepSnap = d.prepare(`SELECT MAX(fetched_at) AS t FROM intel_ip_reputation`).get()?.t;
  const threatMap = {};
  if (latestRepSnap) {
    const repRows = d.prepare(`
      SELECT local_ip, ip_address, reputation, blacklisted
      FROM   intel_ip_reputation
      WHERE  fetched_at = ?
    `).all(latestRepSnap);
    for (const r of repRows) {
      const key = r.local_ip || r.ip_address;
      if (key) threatMap[key] = { reputation: r.reputation, blacklisted: r.blacklisted };
    }
  }

  const allIpRows = domain_breakdown.length > 0 ? domain_breakdown : ipRows;
  const top_ips = allIpRows.map(r => ({
    ip_address  : r.ip_address,
    download    : r.download ?? 0,
    upload      : r.upload   ?? 0,
    flow_count  : r.flow_count ?? 0,
    reputation  : threatMap[r.ip_address]?.reputation  ?? null,
    blacklisted : threatMap[r.ip_address]?.blacklisted ?? false,
  }));

  // ── Per-agent breakdown using MAC-based grouping in flows ──
  const agent_scorecard = Object.entries(AGENT_MAC_MAP).map(([uuid, macs]) => {
    const ph = inClause(macs);
    const likeParams2 = kws ? kws.map(k => `%${k}%`) : [];
    let row;
    if (likeParams2.length > 0) {
      // For brand-name apps: query by domain keywords filtered by agent MAC
      const likeClause2 = likeParams2.map(() => `LOWER(domain) LIKE ?`).join(' OR ');
      row = d.prepare(`
        SELECT SUM(bytes_download) AS download,
               SUM(bytes_upload)   AS upload,
               COUNT(*) AS flow_count
        FROM   flows
        WHERE  src_mac IN (${ph})
          AND  domain IS NOT NULL
          AND  (${likeClause2})
      `).get(...macs, ...likeParams2);
    } else {
      row = d.prepare(`
        SELECT SUM(bytes_download) AS download,
               SUM(bytes_upload)   AS upload,
               COUNT(*) AS flow_count
        FROM   flows
        WHERE  app_label = ?
          AND  src_mac IN (${ph})
      `).get(appLabel, ...macs);
    }
    return {
      agent_uuid  : uuid,
      agent_label : AGENT_LABELS[uuid] || uuid,
      download    : row?.download    ?? 0,
      upload      : row?.upload      ?? 0,
      flow_count  : row?.flow_count  ?? 0,
    };
  }).filter(a => a.download > 0 || a.upload > 0);

  return {
    app_label      : appLabel,
    total_download,
    total_upload,
    data_source,
    agent_scorecard,
    top_ips,
    has_domain_breakdown: domain_breakdown.length > 0,
  };
}


// Fetch security device risk overview — encryption audit + insecure protocols per device
async function fetchSecurityDevices() {
  const db = require('./database');
  const d  = db.getDB();

  const latestFetch = d.prepare(`SELECT MAX(fetched_at) AS t FROM intel_encryption_audit`).get()?.t;
  const encryptRows = latestFetch
    ? d.prepare(`SELECT * FROM intel_encryption_audit WHERE fetched_at = ?`).all(latestFetch)
    : [];

  const insecureRows = d.prepare(`SELECT DISTINCT ip_address FROM intel_insecure_protocols`).all();
  const insecureIPs  = new Set(insecureRows.map(r => r.ip_address).filter(Boolean));

  // Compute risk per device
  const deviceMap = {};
  for (const r of encryptRows) {
    const ip = r.ip_address;
    if (!ip) continue;
    const encPct = r.encrypted_pct ?? 100;
    let riskLevel;
    if (encPct < 50 || insecureIPs.has(ip)) {
      riskLevel = 'Rawan';
    } else if (encPct < 80) {
      riskLevel = 'Sedang';
    } else {
      riskLevel = 'Aman';
    }
    if (!deviceMap[ip] || deviceMap[ip].encrypted_pct < encPct) {
      deviceMap[ip] = {
        ip_address    : ip,
        mac_address   : r.mac_address ?? null,
        device_label  : r.device_label ?? null,
        encrypted_pct : encPct,
        unencrypted   : r.unencrypted ?? 0,
        encrypted     : r.encrypted ?? 0,
        total         : r.total ?? 0,
        risk_level    : riskLevel,
        has_insecure  : insecureIPs.has(ip),
      };
    }
  }

  // Try to get device info (type, OS) from discovery data — table may not exist
  const discMap = {};
  try {
    const discRows = d.prepare(`SELECT DISTINCT ip_address, device_type, os_label, manufacturer FROM devices`).all();
    for (const r of discRows) {
      if (r.ip_address) discMap[r.ip_address] = r;
    }
  } catch (_) {
    // devices table doesn't exist yet — skip enrichment
  }


  const devices = Object.values(deviceMap).map(dev => ({
    ...dev,
    device_type  : discMap[dev.ip_address]?.device_type ?? null,
    os_label     : discMap[dev.ip_address]?.os_label ?? null,
    manufacturer : discMap[dev.ip_address]?.manufacturer ?? null,
  }));

  // Sort: Rawan first, then Sedang, then Aman
  const ORDER = { Rawan: 0, Sedang: 1, Aman: 2 };
  devices.sort((a, b) => (ORDER[a.risk_level] ?? 3) - (ORDER[b.risk_level] ?? 3));

  return devices;
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
  // Interactive detail fetchers
  fetchAgentDetails,
  fetchDeviceDetails,
  fetchAppDetails,
  fetchSecurityDevices,
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