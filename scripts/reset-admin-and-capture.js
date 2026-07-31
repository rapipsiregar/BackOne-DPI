const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const WebSocket = require('next/dist/compiled/ws');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const JWT_SECRET = process.env.JWT_SECRET || 'backone-dpi-secret-jwt-key-2024';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/backone_dpi';

async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    const users = db.collection('users');

    let adminUser = await users.findOne({ username: 'admin' });
    const payload = {
      userId: adminUser._id.toString(),
      username: adminUser.username,
      role: adminUser.role,
      site_uuid: adminUser.site_uuid || 'default',
      agent_uuid: adminUser.agent_uuid || null
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    await mongoose.disconnect();

    const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
    const edgeProc = spawn(edgePath, [
      '--headless',
      '--disable-gpu',
      '--remote-debugging-port=9222',
      '--window-size=400,844',
      'http://localhost:3000/'
    ]);

    await new Promise(r => setTimeout(r, 2500));

    const targets = await new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:9222/json', (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => resolve(JSON.parse(body)));
      }).on('error', reject);
    });

    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
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
      await send('Network.setCookie', { name: 'token', value: token, domain: 'localhost', path: '/' });
      await send('Network.setCookie', { name: 'backone_token', value: token, domain: 'localhost', path: '/' });

      await send('Page.navigate', { url: 'http://localhost:3000/' });
      await new Promise(r => setTimeout(r, 5000));

      const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
      const outputPath = "C:\\Users\\rafif\\.gemini\\antigravity-ide\\brain\\d6704840-c7e7-4558-b215-0fe98bbfb07a\\mobile-full-dashboard-live.png";
      fs.writeFileSync(outputPath, Buffer.from(screenshot.data, 'base64'));
      console.log("Full page screenshot saved to:", outputPath, "Size:", fs.statSync(outputPath).size, "bytes");

      ws.close();
      edgeProc.kill();
    });

  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
