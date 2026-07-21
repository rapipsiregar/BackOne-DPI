const https = require('https');

const PAGES = [
  '/',
  '/network-infrastructure',
  '/agents',
  '/devices',
  '/flows',
  '/apps',
  '/network-intelligence',
  '/dns',
  '/geography',
  '/dpi-analytics',
  '/lookup',
  '/intelligence',
  '/threats',
  '/events',
  '/security-audit',
  '/help'
];

function fetchPage(route) {
  return new Promise((resolve) => {
    https.get(`https://demoplace.my.id${route}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const titleMatch = data.match(/<title>(.*?)<\/title>/i);
        const descMatch = data.match(/<meta name="description" content="(.*?)"/i);
        const title = titleMatch ? titleMatch[1] : 'N/A';
        const desc = descMatch ? descMatch[1] : 'N/A';
        
        // Find logo references
        const logos = [];
        const logoRegex = /src="([^"]*(?:logo|icon)[^"]*)"/gi;
        let match;
        while ((match = logoRegex.exec(data)) !== null) {
          if (!logos.includes(match[1])) logos.push(match[1]);
        }

        resolve({ route, statusCode: res.statusCode, title, desc, logos });
      });
    }).on('error', (err) => {
      resolve({ route, error: err.message });
    });
  });
}

async function main() {
  console.log('=== AUDITING DEMOPLACE.MY.ID PAGES ===\n');
  for (const page of PAGES) {
    const res = await fetchPage(page);
    console.log(`Route: ${res.route}`);
    console.log(`  Title       : ${res.title}`);
    console.log(`  Description : ${res.desc}`);
    console.log(`  Logos/Icons : ${res.logos ? res.logos.join(', ') : 'None'}`);
    console.log('---');
  }
}

main();
