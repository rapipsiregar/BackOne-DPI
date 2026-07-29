// test/fetch-sidebar-logo.js
const axios = require('axios');

async function main() {
  console.log('Logging in as nexus...');
  const loginRes = await axios.post('https://demoplace.my.id/api/auth/login', {
    username: 'nexus',
    password: 'nexus'
  });
  
  const cookie = loginRes.headers['set-cookie'];
  const headers = { Cookie: cookie ? cookie.join('; ') : '' };
  
  console.log('Fetching overview page...');
  const pageRes = await axios.get('https://demoplace.my.id/', { headers });
  
  const html = pageRes.data;
  
  // Find all img tags using a regex
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
  let match;
  console.log('Found image tags in HTML:');
  while ((match = imgRegex.exec(html)) !== null) {
    console.log(' - src:', match[1]);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
});
