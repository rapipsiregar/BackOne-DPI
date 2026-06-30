const Database = require('better-sqlite3');
const db = new Database('c:\\Users\\vanne\\OneDrive\\Dokumen\\Network Magang Baru\\netify-app\\backend\\netify_data.db');

console.log('=== INTERFACES DATA ===');
try {
  const data = db.prepare('SELECT * FROM interfaces').all();
  console.log('Count:', data.length);
  if (data.length > 0) console.log(data.slice(0, 5));
} catch (e) {
  console.error(e.message);
}

console.log('=== FLOWS WITH OTHER COLUMNS? ===');
try {
  // Let's print column names of flows and devices
  const info = db.prepare('PRAGMA table_info(flows)').all();
  console.log('Flows columns:', info.map(i => i.name));
  const info2 = db.prepare('PRAGMA table_info(devices)').all();
  console.log('Devices columns:', info2.map(i => i.name));
} catch (e) {
  console.error(e.message);
}
