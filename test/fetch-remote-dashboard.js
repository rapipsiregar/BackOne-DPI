const axios = require('axios');

async function main() {
  console.log('Logging in to remote server...');
  const loginRes = await axios.post('https://demoplace.my.id/api/auth/login', {
    username: 'nexus',
    password: 'nexus'
  });
  
  const cookie = loginRes.headers['set-cookie'];
  console.log('Login successful. Cookies:', cookie);
  
  console.log('Fetching / (Overview page) with cookie...');
  const pageRes = await axios.get('https://demoplace.my.id/', {
    headers: {
      Cookie: cookie ? cookie.join('; ') : ''
    }
  });
  
  console.log('Page HTTP Status:', pageRes.status);
  console.log('Page HTML length:', pageRes.data.length);
  console.log('HTML snippet (first 500 chars):');
  console.log(pageRes.data.substring(0, 500));
}

main().catch(console.error);
