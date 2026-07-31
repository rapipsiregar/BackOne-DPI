const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('next/dist/compiled/ws');

async function loginAdmin() {
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
        const cookies = res.headers['set-cookie'];
        if (cookies && cookies.length > 0) {
          const cookieStr = cookies[0];
          const match = cookieStr.match(/backone_token=([^;]+)/);
          resolve(match ? match[1] : null);
        } else {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.write(data);
    req.end();
  });
}

async function capture() {
  const token = await loginAdmin();
  console.log("Logged in admin token:", token ? "FOUND" : "NOT FOUND");

  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const edgeProc = spawn(edgePath, [
    '--headless',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    '--window-size=400,844',
    'http://localhost:3000/login'
  ]);

  // Wait 2.5s for Edge CDP to listen
  await new Promise(r => setTimeout(r, 2500));

  try {
    const targets = await new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:9222/json', (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => resolve(JSON.parse(body)));
      }).on('error', reject);
    });

    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      console.error("No CDP page target found:", targets);
      edgeProc.kill();
      return;
    }

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let messageId = 1;
    const send = (method, params = {}) => {
      return new Promise((res) => {
        const id = messageId++;
        const handler = (data) => {
          const msg = JSON.parse(data);
          if (msg.id === id) {
            ws.removeListener('message', handler);
            res(msg.result);
          }
        };
        ws.on('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    ws.on('open', async () => {
      console.log("Connected to Edge CDP WebSocket!");
      
      if (token) {
        await send('Network.setCookie', {
          name: 'backone_token',
          value: token,
          domain: 'localhost',
          path: '/'
        });
      }

      await send('Page.navigate', { url: 'http://localhost:3000/' });
      // Wait for page load and 3D globe rendering
      await new Promise(r => setTimeout(r, 5000));

      const screenshot = await send('Page.captureScreenshot', { format: 'png' });
      const outputPath = "C:\\Users\\rafif\\.gemini\\antigravity-ide\\brain\\d6704840-c7e7-4558-b215-0fe98bbfb07a\\mobile-dashboard-live.png";
      fs.writeFileSync(outputPath, Buffer.from(screenshot.data, 'base64'));
      console.log("SUCCESS! Screenshot written to:", outputPath, "Size:", fs.statSync(outputPath).size, "bytes");

      ws.close();
      edgeProc.kill();
    });

  } catch (err) {
    console.error("CDP Error:", err.message);
    edgeProc.kill();
  }
}

capture();
