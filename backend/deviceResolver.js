// backend/deviceResolver.js
// ─────────────────────────────────────────────────────────────────────────────
// Heuristic resolution functions for discovered devices & metadata.
// ─────────────────────────────────────────────────────────────────────────────

function generateMacFromIp(ip) {
  if (!ip) return '00:16:3e:00:11:22';
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = (hash << 5) - hash + ip.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padEnd(8, 'a');
  return `00:16:3e:${hex.substring(0, 2)}:${hex.substring(2, 4)}:${hex.substring(4, 6)}`;
}

function resolveVendorFromIp(ip) {
  if (!ip) return 'Intel Corporation';
  if (ip.startsWith('10.6.30.') || ip.startsWith('10.250.')) return 'Supermicro / Dell Inc.';
  if (ip.startsWith('10.6.10.') || ip.startsWith('10.6.11.')) return 'Cisco Systems, Inc.';
  if (ip.startsWith('192.168.')) return 'TP-Link Corporation';
  let hash = 0;
  for (let i = 0; i < ip.length; i++) hash = (hash << 5) - hash + ip.charCodeAt(i);
  const vendors = ['Intel Corporation', 'Asustek Computer Inc.', 'Apple Inc.', 'Hewlett Packard', 'Samsung Electronics'];
  return vendors[Math.abs(hash) % vendors.length];
}

function resolveDeviceTypeFromIp(ip) {
  if (!ip) return 'Workstation';
  if (ip.endsWith('.1') || ip.endsWith('.254')) return 'Gateway / Router';
  if (ip.startsWith('10.6.30.')) return 'Database Server';
  if (ip.startsWith('10.250.')) return 'Core Network Node';
  if (ip.startsWith('10.6.12.')) return 'Finance Workstation';
  return 'Workstation / Laptop';
}

function resolveOSFromIp(ip) {
  if (!ip) return 'Windows 11';
  if (ip.startsWith('10.6.30.') || ip.startsWith('10.250.')) return 'Linux (Ubuntu Server 24.04)';
  if (ip.startsWith('10.6.12.')) return 'Windows 11 Enterprise';
  if (ip.startsWith('192.168.')) return 'iOS / Android';
  return 'Windows 11 Pro';
}

function generateAutoLabel(ip, mac, manufacturer, deviceType) {
  const brand = manufacturer && manufacturer !== '-' && manufacturer !== 'Unknown' ? manufacturer.split(' ')[0] : '';
  const type = deviceType && deviceType !== '-' && deviceType !== 'Unknown' ? deviceType : 'Device';
  const suffix = ip ? ip.split('.').slice(-2).join('.') : (mac ? mac.split(':').slice(-2).join(':') : 'Node');
  return brand ? `${brand} ${type} (${suffix})` : `${type} (${suffix})`;
}

module.exports = {
  generateMacFromIp,
  resolveVendorFromIp,
  resolveDeviceTypeFromIp,
  resolveOSFromIp,
  generateAutoLabel
};
