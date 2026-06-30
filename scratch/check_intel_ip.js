const Database = require('better-sqlite3');
const db = new Database('c:\\Users\\vanne\\OneDrive\\Dokumen\\Network Magang Baru\\netify-app\\backend\\netify_data.db');

const ip = '10.250.192.202';

console.log('=== ENCRYPTION AUDIT FOR IP ===');
try {
  const data = db.prepare('SELECT * FROM intel_encryption_audit WHERE ip_address = ?').all(ip);
  console.log(data);
} catch (e) {
  console.error(e.message);
}

console.log('=== INSECURE PROTOCOLS FOR IP ===');
try {
  const data = db.prepare('SELECT * FROM intel_insecure_protocols WHERE ip_address = ?').all(ip);
  console.log(data);
} catch (e) {
  console.error(e.message);
}

console.log('=== IP REPUTATION FOR IP ===');
try {
  const data = db.prepare('SELECT * FROM intel_ip_reputation WHERE ip_address = ? OR local_ip = ?').all(ip, ip);
  console.log(data);
} catch (e) {
  console.error(e.message);
}
