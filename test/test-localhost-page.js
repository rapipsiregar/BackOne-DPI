const axios = require('axios');

async function main() {
  console.log('Logging in to localhost Next.js server on port 3000...');
  const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
    username: 'admin',
    password: 'admin'
  });
  
  const cookie = loginRes.headers['set-cookie'];
  const headers = {
    Cookie: cookie ? cookie.join('; ') : ''
  };

  console.log('Fetching localhost /api/auth/admin/users...');
  const res = await axios.get('http://localhost:3000/api/auth/admin/users', { headers });
  console.log('Total users returned:', res.data.data.length);
  console.log('Users list:');
  res.data.data.forEach(u => {
    console.log(`- Username: ${u.username}, Role: ${u.role}, Site: ${u.site_uuid}`);
  });
}

main().catch(console.error);
