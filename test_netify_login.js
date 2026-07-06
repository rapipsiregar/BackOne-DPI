const axios = require('axios');

async function login() {
  try {
    const res = await axios.post('https://manager.netify.ai/api/v1/auth/login', {
      email: 'yoga.pratama@databisnis.id',
      password: 'Aku001122**'
    }, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });
    console.log("LOGIN SUCCESS:", res.data);
  } catch (err) {
    console.log("LOGIN FAILED:", err.response ? err.response.data : err.message);
  }
}

login();
