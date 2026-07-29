const axios = require('axios');

async function main() {
  console.log('Fetching /login HTML to find all asset paths...');
  const res = await axios.get('https://demoplace.my.id/login');
  const html = res.data;
  
  // Extract all /_next/static/ paths
  const matches = html.match(/\/(_next|public)\/[a-zA-Z0-9_\-\.\/]+/g) || [];
  const uniquePaths = [...new Set(matches)];
  
  console.log(`Found ${uniquePaths.length} unique asset paths to check:`);
  
  let failed = 0;
  for (const assetPath of uniquePaths) {
    const url = `https://demoplace.my.id${assetPath}`;
    try {
      const assetRes = await axios.get(url);
      console.log(`✓ [200 OK] ${assetPath} (${assetRes.headers['content-length'] || assetRes.data.length} bytes)`);
    } catch (err) {
      console.error(`✗ [FAIL] ${assetPath}: ${err.message}`);
      failed++;
    }
  }
  
  console.log(`\n=== Verification Complete: ${uniquePaths.length - failed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
