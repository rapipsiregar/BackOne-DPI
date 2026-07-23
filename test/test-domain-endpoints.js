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

  console.log('\n--- API: /api/auth/me ---');
  try {
    const res = await axios.get('https://demoplace.my.id/api/auth/me', { headers });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err.message);
  }

  console.log('\n--- API: /api/auth/admin/users ---');
  try {
    const res = await axios.get('https://demoplace.my.id/api/auth/admin/users', { headers });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err.message);
  }

  console.log('\n--- API: /api/dashboard/agents ---');
  try {
    const res = await axios.get('https://demoplace.my.id/api/dashboard/agents', { headers });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err.message);
  }

  console.log('\n--- API: /api/dashboard/agents/uptime ---');
  try {
    const res = await axios.get('https://demoplace.my.id/api/dashboard/agents/uptime', { headers });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err.message);
  }
}

main().catch(console.error);
