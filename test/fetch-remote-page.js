const axios = require('axios');

async function main() {
  console.log('Logging in to remote server...');
  const loginRes = await axios.post('https://demoplace.my.id/api/auth/login', {
    username: 'admin',
    password: 'admin'
  });
  
  const cookie = loginRes.headers['set-cookie'];
  console.log('Login successful. Cookies:', cookie);
  
  console.log('Fetching /agents page...');
  const pageRes = await axios.get('https://demoplace.my.id/agents', {
    headers: {
      Cookie: cookie ? cookie.join('; ') : ''
    }
  });
  
  const html = pageRes.data;
  console.log('Page HTML length:', html.length);
  
  const hasSuperadminTable = html.includes('Superadmin (BackOne) External Accounts');
  const hasInventoryTable = html.includes('External Accounts Inventory');
  console.log('Contains Superadmin table:', hasSuperadminTable);
  console.log('Contains Inventory table:', hasInventoryTable);
  
  // Find where table title is mentioned
  const idx1 = html.indexOf('Superadmin (BackOne)');
  if (idx1 !== -1) {
    console.log('Snippet around Superadmin:', html.substring(idx1 - 100, idx1 + 200));
  }
  const idx2 = html.indexOf('External Accounts Inventory');
  if (idx2 !== -1) {
    console.log('Snippet around Inventory:', html.substring(idx2 - 100, idx2 + 200));
  }
}

main().catch(console.error);
