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

  console.log('\n--- API: /api/dashboard/summary ---');
  try {
    const res = await axios.get('https://demoplace.my.id/api/dashboard/summary', { headers });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err.message);
  }

  console.log('\n--- API: /api/dashboard/timeline ---');
  try {
    const res = await axios.get('https://demoplace.my.id/api/dashboard/timeline?points=5', { headers });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err.message);
  }
}

main().catch(console.error);
