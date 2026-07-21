const db = require('better-sqlite3')('backend/netify_data.db');
console.log('Devices:', db.prepare("SELECT * FROM devices WHERE ip_address = '192.168.9.2'").all());
console.log('Discovery:', db.prepare("SELECT * FROM intel_device_discovery WHERE ip_address = '192.168.9.2'").all());
