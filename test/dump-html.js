const axios = require('axios');

async function main() {
  const loginRes = await axios.post('https://demoplace.my.id/api/auth/login', {
    username: 'admin',
    password: 'admin'
  });
  
  const cookie = loginRes.headers['set-cookie'];
  const pageRes = await axios.get('https://demoplace.my.id/agents', {
    headers: {
      Cookie: cookie ? cookie.join('; ') : ''
    }
  });
  
  const html = pageRes.data;
  
  console.log("=== HEADINGS ===");
  const headings = html.match(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi) || [];
  headings.forEach(h => console.log(h.replace(/<[^>]+>/g, '').trim()));

  console.log("=== CARD TITLES OR TABLE TITLES ===");
  const textMatches = html.match(/[^>]{5,100}(?:External Accounts|Agents|Inventory|Tenant)[^<]{5,100}/gi) || [];
  textMatches.slice(0, 30).forEach(t => console.log(t.replace(/<[^>]+>/g, '').trim()));
}

main().catch(console.error);
