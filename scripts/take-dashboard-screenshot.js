const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

function loginAndGetCookie() {
  return new Promise((resolve) => {
    const data = JSON.stringify({ username: 'admin', password: 'admin' });
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log("Login HTTP Status:", res.statusCode);
        const setCookieHeader = res.headers['set-cookie'];
        if (setCookieHeader && setCookieHeader.length > 0) {
          const cookieVal = setCookieHeader[0].split(';')[0];
          console.log("Authenticated Cookie:", cookieVal);
          resolve(cookieVal);
        } else {
          console.log("No Set-Cookie header returned:", body);
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.error("Login request error:", err.message);
      resolve(null);
    });

    req.write(data);
    req.end();
  });
}

async function run() {
  const cookieHeader = await loginAndGetCookie();
  if (!cookieHeader) {
    console.error("Failed to authenticate with admin/admin");
    return;
  }

  // We can write a small local page or fetch the authenticated pages
  // Or launch edge with cookie set via devtools protocol or curl
  console.log("Fetching authenticated HTML for / ...");
  
  const req = http.request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/',
    method: 'GET',
    headers: {
      'Cookie': cookieHeader
    }
  }, (res) => {
    console.log("Dashboard GET Status:", res.statusCode);
  });
  req.end();

  // Save cookie into edge user data folder or launch edge with custom session
  const userDataDir = path.join(__dirname, 'edge_session_dir');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const outputDir = "C:\\Users\\rafif\\.gemini\\antigravity-ide\\brain\\d6704840-c7e7-4558-b215-0fe98bbfb07a";
  const outputFile = path.join(outputDir, "mobile-dashboard-overview.png");

  // In order to inject cookie into headless Edge, we can pass --app with cookie or use curl/chrome-remote-interface
  console.log("Executing Edge capture...");
  const res = spawnSync(edgePath, [
    '--headless',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    '--window-size=400,844',
    `--screenshot=${outputFile}`,
    'http://localhost:3000/'
  ], { encoding: 'utf-8', timeout: 15000 });

  console.log("Done! Exit code:", res.status);
}

run();
