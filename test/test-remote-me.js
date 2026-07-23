const axios = require('axios');

async function main() {
  console.log('Logging in to remote server...');
  const loginRes = await axios.post('https://demoplace.my.id/api/auth/login', {
    username: 'admin',
    password: 'admin'
  });
  
  const cookie = loginRes.headers['set-cookie'];
  console.log('Login successful. Cookies:', cookie);
  
  console.log('Fetching /api/auth/me ...');
  try {
    const meRes = await axios.get('https://demoplace.my.id/api/auth/me', {
      headers: {
        Cookie: cookie ? cookie.join('; ') : ''
      }
    });
    console.log('Me status:', meRes.status);
    console.log('Me response:', meRes.data);
  } catch (err) {
    if (err.response) {
      console.error('Me failed. Status:', err.response.status, 'Response:', err.response.data);
    } else {
      console.error('Me failed. Error:', err.message);
    }
  }
}

main().catch(console.error);
