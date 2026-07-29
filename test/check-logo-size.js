// test/check-logo-size.js
const axios = require('axios');

async function main() {
  const url = 'https://demoplace.my.id/nexus-logo.png';
  const res = await axios.head(url);
  console.log('Remote nexus-logo.png content-length:', res.headers['content-length']);
  console.log('Remote nexus-logo.png content-type:', res.headers['content-type']);
}

main().catch(err => console.error(err.message));
