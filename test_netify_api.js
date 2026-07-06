const axios = require('axios');

async function testApi(url) {
  try {
    const res = await axios.post(url, {
      email: 'yoga.pratama@databisnis.id',
      password: 'Aku001122**'
    }, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });
    console.log(`[SUCCESS] ${url}:`, res.data);
  } catch (err) {
    console.log(`[FAILED] ${url}:`, err.response ? err.response.data : err.message);
  }
}

testApi('https://manager.netify.ai/api/v1/auth/login');
testApi('https://informatics.netify.ai/api/v1/auth/login');
testApi('https://portal.netify.ai/api/login');
