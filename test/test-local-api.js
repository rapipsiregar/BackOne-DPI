const axios = require('axios');

async function main() {
  console.log('Logging in to localhost...');
  const loginRes = await axios.post('http://localhost:3001/api/auth/login', {
    username: 'admin',
    password: 'admin'
  });
  
  const cookie = loginRes.headers['set-cookie'];
  console.log('Login successful. Cookies:', cookie);
  
  console.log('Fetching /api/auth/me...');
  const meRes = await axios.get('http://localhost:3001/api/auth/me', {
    headers: {
      Cookie: cookie ? cookie.join('; ') : ''
    }
  });
  console.log('/api/auth/me response:', meRes.data);
  
  console.log('Fetching /api/auth/admin/users...');
  const usersRes = await axios.get('http://localhost:3001/api/auth/admin/users', {
    headers: {
      Cookie: cookie ? cookie.join('; ') : ''
    }
  });
  console.log('/api/auth/admin/users response:', usersRes.data);
}

main().catch(console.error);
