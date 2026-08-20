// test/sync_test.js
// TDD Integration Test: Verifikasi sinkronisasi 100% file antara Localhost dan Domain
'use strict';

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load environment variables if available
try {
  require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
} catch (e) {}

const SSH = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 60000
};

const REMOTE_ROOT = '/home/adminbackend/web/dev.demoplace.my.id/public_html';
const LOCAL_ROOT = path.join(__dirname, '..');

let testCount = 0;
let passedCount = 0;

function assert(label, condition) {
  testCount++;
  if (condition) {
    console.log(`  ✓ PASSED: ${label}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAILED: ${label}`);
  }
}

function getMD5(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(data).digest('hex');
  } catch (e) {
    return null;
  }
}

function getFilesLocal(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (item !== 'node_modules' && item !== '.next' && item !== '.git') {
        getFilesLocal(fullPath, files);
      }
    } else {
      files.push(path.relative(LOCAL_ROOT, fullPath).replace(/\\/g, '/'));
    }
  }
  return files;
}

const remoteScript = `
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = '/home/adminbackend/web/dev.demoplace.my.id/public_html';

function getMD5(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(data).digest('hex');
  } catch (e) {
    return null;
  }
}

function getFilesRemote(dir, files = {}) {
  try {
    const list = fs.readdirSync(dir);
    for (const item of list) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (item !== 'node_modules' && item !== '.next' && item !== '.git') {
          getFilesRemote(fullPath, files);
        }
      } else {
        const rel = path.relative(root, fullPath);
        files[rel] = { md5: getMD5(fullPath), size: stat.size };
      }
    }
  } catch(e) {}
  return files;
}

const filesMap = {};
getFilesRemote(path.join(root, 'src'), filesMap);
getFilesRemote(path.join(root, 'public'), filesMap);
getFilesRemote(path.join(root, 'backend'), filesMap);
getFilesRemote(path.join(root, 'proxy'), filesMap);

const rootConfigs = ['package.json', 'tsconfig.json', 'next.config.ts', '.env.production'];
for (const f of rootConfigs) {
  const full = path.join(root, f);
  if (fs.existsSync(full)) {
    const stat = fs.statSync(full);
    filesMap[f] = { md5: getMD5(full), size: stat.size };
  }
}

console.log(JSON.stringify(filesMap));
`;

async function runTests() {
  console.log('\n=========================================');
  console.log('  RUNNING TDD SYNC COMPARISON TESTS');
  console.log('=========================================\n');

  let remoteFiles = {};
  try {
    const conn = new Client();
    const remoteFilesStr = await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        const b64 = Buffer.from(remoteScript).toString('base64');
        conn.exec(`echo "${b64}" | base64 -d | node`, (err, stream) => {
          if (err) return reject(err);
          let out = '';
          let errOut = '';
          stream.on('data', d => out += d);
          stream.stderr.on('data', d => errOut += d);
          stream.on('close', () => {
            conn.end();
            if (errOut.trim()) {
              reject(new Error(errOut));
            } else {
              resolve(out);
            }
          });
        });
      }).on('error', reject).connect(SSH);
    });
    
    remoteFiles = JSON.parse(remoteFilesStr);
    console.log('✓ Connected to remote server and retrieved remote file list.');
  } catch (err) {
    console.error('✗ Failed to connect to remote server:', err.message);
    process.exit(1);
  }

  // Get local files
  const localFiles = {};
  const pathsToCheck = ['src', 'public', 'backend', 'proxy'];
  for (const p of pathsToCheck) {
    const full = path.join(LOCAL_ROOT, p);
    if (fs.existsSync(full)) {
      const files = getFilesLocal(full);
      for (const f of files) {
        const localPath = path.join(LOCAL_ROOT, f);
        localFiles[f] = { md5: getMD5(localPath) };
      }
    }
  }
  const rootConfigs = ['package.json', 'tsconfig.json', 'next.config.ts', '.env.production'];
  for (const f of rootConfigs) {
    const full = path.join(LOCAL_ROOT, f);
    if (fs.existsSync(full)) {
      localFiles[f] = { md5: getMD5(full) };
    }
  }

  // Perform assertions
  for (const [relPath, info] of Object.entries(remoteFiles)) {
    const localInfo = localFiles[relPath];
    assert(`File "${relPath}" should exist locally`, !!localInfo);
    if (localInfo) {
      assert(`File "${relPath}" content should match remote exactly`, localInfo.md5 === info.md5);
    }
  }

  console.log(`\n=========================================`);
  console.log(`  RESULT: ${passedCount} / ${testCount} tests passed.`);
  console.log(`=========================================\n`);

  if (passedCount !== testCount) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(e => {
  console.error('[FATAL]', e.message);
  process.exit(1);
});
