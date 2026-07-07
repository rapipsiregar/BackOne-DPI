const { Client } = require('ssh2');

const conn = new Client();

const script = `
node -e "
const http = require('http');

const loginOptions = {
  hostname: '127.0.0.1',
  port: 3001,
  path: '/api/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
};

const req = http.request(loginOptions, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const session = JSON.parse(data).session_id;
    if (!session) { console.log('Login failed'); return; }
    
    // Test Agent
    http.get({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/agents/2F-TF-1D-GK',
      headers: { 'Authorization': 'Bearer ' + session }
    }, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        const agent = JSON.parse(d);
        console.log('--- AGENT 2F-TF-1D-GK ---');
        console.log('Devices:', agent.summary.total_devices);
        console.log('Flows:', agent.summary.active_flows);
        console.log('Download:', agent.summary.bandwidth_down);
        console.log('Upload:', agent.summary.bandwidth_up);
        console.log('Top Apps count:', agent.top_apps.length);
      });
    });

    // Test Dashboard
    http.get({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/dashboard',
      headers: { 'Authorization': 'Bearer ' + session }
    }, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        const dash = JSON.parse(d);
        console.log('--- DASHBOARD ---');
        console.log('Total Download:', dash.summary.bandwidth_down);
        console.log('Total Upload:', dash.summary.bandwidth_up);
        console.log('Devices:', dash.summary.total_devices);
        console.log('Flows:', dash.summary.active_flows);
      });
    });
  });
});
req.write(JSON.stringify({ username: 'admin', password: '123' })); // Wait, default admin is admin / admin
req.end();
"
`;

conn.on('ready', () => {
  conn.exec(script.replace(/123/g, 'admin'), (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end()).on('data', d => process.stdout.write(d)).stderr.on('data', d => process.stderr.write(d));
  });
}).on('error', (err) => {
  console.error('SSH Error:', err);
}).connect({
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH'
});
