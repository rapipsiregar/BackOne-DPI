const https = require('https');

const ROUTES = [
  '/',
  '/agents',
  '/apps',
  '/devices',
  '/dns',
  '/dpi-analytics',
  '/encryption-audit',
  '/events',
  '/flows',
  '/geography',
  '/intelligence',
  '/lookup',
  '/network-infrastructure',
  '/network-intelligence',
  '/network-topology',
  '/security-audit',
  '/threat-intelligence',
  '/threats',
  '/traffic-categories',
  '/help',
  '/login'
];

function auditRoute(route) {
  return new Promise((resolve) => {
    https.get(`https://demoplace.my.id${route}`, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const title = (data.match(/<title>(.*?)<\/title>/i) || [])[1] || 'N/A';
        const desc = (data.match(/<meta name="description" content="(.*?)"/i) || [])[1] || 'N/A';
        const icons = [];
        const iconMatches = data.matchAll(/rel="icon" href="([^"]+)"/gi);
        for (const m of iconMatches) icons.push(m[1]);

        const imgs = [];
        const imgMatches = data.matchAll(/src="([^"]*(?:logo|brand|icon|png|svg|jpg)[^"]*)"/gi);
        for (const m of imgMatches) {
          if (!imgs.includes(m[1])) imgs.push(m[1]);
        }

        const headers = [];
        const hMatches = data.matchAll(/<h[123][^>]*>(.*?)<\/h[123]>/gi);
        for (const m of hMatches) {
          const clean = m[1].replace(/<[^>]+>/g, '').trim();
          if (clean && !headers.includes(clean)) headers.push(clean);
        }

        resolve({
          route,
          status: res.statusCode,
          is404: data.includes('404: This page could not be found'),
          title,
          desc,
          icons,
          imgs,
          headers
        });
      });
    }).on('error', err => resolve({ route, error: err.message }));
  });
}

async function main() {
  console.log('=== DETAILED AUDIT OF DEMOPLACE.MY.ID ===\n');
  for (const r of ROUTES) {
    const res = await auditRoute(r);
    if (res.is404) {
      console.log(`❌ [404 NOT FOUND] ${res.route}`);
    } else {
      console.log(`✅ [200 OK] ${res.route}`);
      console.log(`   Title      : ${res.title}`);
      console.log(`   Icons      : ${res.icons.join(', ')}`);
      console.log(`   Images/Logo: ${res.imgs.join(', ')}`);
      console.log(`   Headers    : ${res.headers.join(' | ')}`);
    }
    console.log('--------------------------------------------------');
  }
}

main();
