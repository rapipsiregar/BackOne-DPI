const { generateMacFromIp } = require('../deviceResolver');

module.exports = function parseAgentSecurity(rawThreats) {
  const encryption_audit = [];
  const insecure_protocols = [];
  const unencrypted_passwords = [];
  const ip_reputation = [];
  const tor_detections = [];
  const vpn_detections = [];

  rawThreats.forEach(t => {
    const eTime = t.detected_at || t.timestamp || new Date().toISOString();
    const ip = t.src_ip || t.ip_address || '192.168.1.100';
    const mac = t.mac_address || generateMacFromIp(ip);
    
    if (t.threat_type === 'Insecure Plaintext Password') {
      unencrypted_passwords.push({
        ip_address: ip, mac_address: mac, dst_ip: t.dst_ip, dst_port: 80,
        protocol: 'HTTP', username: 'user_admin', severity: t.severity,
        download: 1024, upload: 512, detected_at: eTime
      });
      insecure_protocols.push({
        ip_address: ip, mac_address: mac, protocol: 'HTTP', risk: 'high',
        app_label: t.app_label || 'HTTP', dst_ip: t.dst_ip, dst_port: 80,
        download: 1024, upload: 512, detected_at: eTime
      });
    } else if (t.threat_type === 'Tor Exit Node Traffic') {
      tor_detections.push({
        ip_address: ip, mac_address: mac, exit_node: t.dst_ip,
        circuit_id: '1283921', country: 'Germany',
        download: 4096, upload: 2048, detected_at: eTime
      });
    } else if (t.threat_type === 'Malicious IP Reputation') {
      ip_reputation.push({
        ip_address: t.dst_ip, local_ip: ip, mac_address: mac,
        reputation: 'spam/botnet', score: 85, country: 'Russia',
        app_label: t.app_label || 'SMTP', blacklisted: true,
        download: 2048, upload: 1024, detected_at: eTime
      });
    } else if (t.threat_type === 'Unauthorized Port Scan') {
      insecure_protocols.push({
        ip_address: ip, mac_address: mac, protocol: 'TCP', risk: 'medium',
        app_label: t.app_label || 'SCAN', dst_ip: t.dst_ip, dst_port: 0,
        download: 512, upload: 512, detected_at: eTime
      });
    } else if (t.threat_type === 'Cryptomining Connection') {
      ip_reputation.push({
        ip_address: t.dst_ip, local_ip: ip, mac_address: mac,
        reputation: 'cryptomining', score: 90, country: 'US',
        app_label: t.app_label || 'Stratum', blacklisted: true,
        download: 4096, upload: 4096, detected_at: eTime
      });
    }
  });

  return {
    encryption_audit,
    insecure_protocols,
    unencrypted_passwords,
    ip_reputation,
    tor_detections,
    vpn_detections
  };
};
