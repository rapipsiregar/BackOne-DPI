const axios = require('axios');

async function main() {
  console.log('Fetching /login HTML to find asset paths...');
  const res = await axios.get('https://demoplace.my.id/login');
  const html = res.data;
  
  // Find a CSS asset path
  const cssMatch = html.match(/\/_next\/static\/chunks\/[a-zA-Z0-9_-]+\.css/);
  if (cssMatch) {
    const cssPath = cssMatch[0];
    console.log('Found CSS path:', cssPath);
    console.log('Fetching CSS asset from domain...');
    try {
      const cssRes = await axios.get(`https://demoplace.my.id${cssPath}`);
      console.log('CSS Status:', cssRes.status);
      console.log('CSS Content-Type:', cssRes.headers['content-type']);
      console.log('CSS Content-Length:', cssRes.headers['content-length']);
      console.log('CSS Content snippet:', cssRes.data.substring(0, 200));
    } catch (err) {
      console.error('Failed to fetch CSS:', err.message);
    }
  } else {
    console.log('No CSS asset path match found in HTML!');
  }
}

main().catch(console.error);
