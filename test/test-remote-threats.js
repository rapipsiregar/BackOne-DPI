const axios = require('axios');

async function main() {
  console.log('Logging in to remote server...');
  const loginRes = await axios.post('https://demoplace.my.id/api/auth/login', {
    username: 'admin',
    password: 'admin'
  });
  
  const cookie = loginRes.headers['set-cookie'];
  const headers = {
    Cookie: cookie ? cookie.join('; ') : ''
  };

  console.log('\n--- API: /api/dashboard/threats?timeRange=1d ---');
  try {
    const res = await axios.get('https://demoplace.my.id/api/dashboard/threats?timeRange=1d', { headers });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err.message);
  }

  console.log('\n--- API: /api/dashboard/threats?timeRange=all ---');
  try {
    const res = await axios.get('https://demoplace.my.id/api/dashboard/threats?timeRange=all', { headers });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err.message);
  }
}

main().catch(console.error);
