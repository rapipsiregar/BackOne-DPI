const db = require('../backend/database').getDB();

// Check all flows - how many have domain vs just port
const stats = db.prepare(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN domain IS NOT NULL THEN 1 ELSE 0 END) as with_domain,
    SUM(CASE WHEN app_label IS NOT NULL AND app_label NOT LIKE 'Port %' THEN 1 ELSE 0 END) as named_app,
    SUM(CASE WHEN app_label LIKE 'Port %' THEN 1 ELSE 0 END) as port_only,
    SUM(CASE WHEN app_label IS NULL AND domain IS NULL THEN 1 ELSE 0 END) as both_null
  FROM flows
`).get();
console.log('Flow stats:', stats);

// What are the unique domain values?
const uniqueDomains = db.prepare(`SELECT DISTINCT domain FROM flows WHERE domain IS NOT NULL LIMIT 20`).all();
console.log('\nUnique domains in DB:', uniqueDomains.length);
uniqueDomains.forEach(r => console.log(' ', r.domain));

// What devices have domain data, and how many?
console.log('\n\nDevices with domain+app data:');
const devDomains = db.prepare(`
  SELECT src_ip, src_mac,
    COUNT(*) total_flows,
    SUM(CASE WHEN domain IS NOT NULL THEN 1 ELSE 0 END) domain_flows,
    SUM(CASE WHEN app_label IS NOT NULL AND app_label NOT LIKE 'Port %' THEN 1 ELSE 0 END) named_flows,
    GROUP_CONCAT(DISTINCT domain) sample_domains
  FROM flows
  WHERE domain IS NOT NULL OR (app_label IS NOT NULL AND app_label NOT LIKE 'Port %')
  GROUP BY src_ip
  ORDER BY domain_flows DESC
  LIMIT 10
`).all();
devDomains.forEach(r => {
  const {sample_domains, ...rest} = r;
  console.log(JSON.stringify(rest));
  if (sample_domains) console.log('  domains:', sample_domains.split(',').slice(0,3).join(', '));
});
