const Database = require('better-sqlite3');
const db = new Database('c:\\Users\\vanne\\OneDrive\\Dokumen\\Network Magang Baru\\netify-app\\backend\\netify_data.db');

try {
  const agents = db.prepare('SELECT DISTINCT agent_id FROM interfaces').all();
  console.log('Unique agent_ids in interfaces:', agents);
} catch (e) {
  console.error(e.message);
}

try {
  const ifaces = db.prepare('SELECT * FROM interfaces LIMIT 10').all();
  console.log('Sample interfaces:', ifaces);
} catch (e) {
  console.error(e.message);
}
