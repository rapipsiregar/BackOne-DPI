const http = require('http');

http.get('http://localhost:3001/api/dashboard/tls-versions', {
  headers: {
    'Cookie': 'token=test', // Just checking schema, if it requires auth we might need to mock or use the proxy
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Response TLS Versions:");
    console.log(data.slice(0, 500));
  });
});
