const db = require('../database');

const d = db.getDB();

const tables = d.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('=== ALL TABLES ===');
tables.forEach(t => {
  try {
    const cnt = d.prepare('SELECT COUNT(*) as c FROM ' + t.name).get().c;
    const cols = d.prepare('PRAGMA table_info(' + t.name + ')').all().map(c => c.name);
    console.log(t.name + ' (' + cnt + ' rows)');
    console.log('  cols: ' + cols.join(', '));
    if (cnt > 0) {
      const sample = d.prepare('SELECT * FROM ' + t.name + ' LIMIT 1').get();
      console.log('  sample: ' + JSON.stringify(sample));
    }
    console.log('');
  } catch(e) {
    console.log(t.name + ': ERROR ' + e.message);
  }
});
