const axios = require('axios');

async function main() {
  try {
    console.log('Fetching https://demoplace.my.id/ ...');
    const res1 = await axios.get('https://demoplace.my.id/', { maxRedirects: 0, validateStatus: () => true });
    console.log('Status /:', res1.status);
    console.log('Headers /:', res1.headers);
    console.log('Body snippet /:', res1.data.substring(0, 500));
  } catch (err) {
    console.error('Error /:', err.message);
  }

  try {
    console.log('\nFetching https://demoplace.my.id/login ...');
    const res2 = await axios.get('https://demoplace.my.id/login', { maxRedirects: 0, validateStatus: () => true });
    console.log('Status /login:', res2.status);
    console.log('Headers /login:', res2.headers);
    console.log('Body snippet /login:', res2.data.substring(0, 500));
  } catch (err) {
    console.error('Error /login:', err.message);
  }
}

main().catch(console.error);
