const { Client } = require('ssh2');

const SSH = {
  host: process.env.SSH_HOST || '127.0.0.1',
  port: parseInt(process.env.SSH_PORT || '2222'),
  username: process.env.SSH_USER || 'adminbackend',
  password: process.env.SSH_PASSWORD || '',
  readyTimeout: 60000
};

const remoteJs = `
const mongoose = require('/home/adminbackend/web/demoplace.my.id/public_html/backend/node_modules/mongoose');

async function main() {
  console.log('Remote: Requiring mongoose succeeded. Connecting...');
  const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/backone_dpi';
  try {
    await mongoose.connect(URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log('Remote: Connected to DB.');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Remote: Listed collections.');
    const result = {};
    for (const col of collections) {
      const name = col.name;
      console.log('Remote: Querying collection ' + name);
      const count = await db.collection(name).countDocuments({});
      if (['users', 'tenantconfigs', 'customagentlocations', 'blacklistrules', 'summaries'].includes(name)) {
        const docs = await db.collection(name).find({}).toArray();
        result[name] = { count, docs };
      } else {
        result[name] = { count };
      }
    }
    console.log('--- JSON_START ---');
    console.log(JSON.stringify(result));
    console.log('--- JSON_END ---');
  } catch (err) {
    console.error('Remote Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Remote: Mongoose disconnected.');
  }
}
main();
`;

const conn = new Client();
conn.on('ready', () => {
  const b64 = Buffer.from(remoteJs).toString('base64');
  conn.exec(`echo "${b64}" | base64 -d | node`, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    let out = '';
    stream.on('data', d => {
      const chunk = d.toString();
      process.stdout.write(chunk);
      out += chunk;
    });
    stream.stderr.on('data', d => {
      process.stderr.write(d.toString());
    });
    stream.on('close', () => {
      const startIdx = out.indexOf('--- JSON_START ---');
      const endIdx = out.indexOf('--- JSON_END ---');
      if (startIdx !== -1 && endIdx !== -1) {
        const jsonStr = out.substring(startIdx + '--- JSON_START ---'.length, endIdx).trim();
        try {
          const parsed = JSON.parse(jsonStr);
          console.log('\n--- REMOTE COLLECTIONS INFO ---');
          for (const [name, info] of Object.entries(parsed)) {
            console.log(`- ${name}: ${info.count} documents`);
          }
          const fs = require('fs');
          fs.writeFileSync('C:\\Users\\demo\\.gemini\\antigravity-ide\\scratch\\remote_db_dump.json', jsonStr);
          console.log('\n✓ Saved full DB dump locally to scratch/remote_db_dump.json');
        } catch (e) {
          console.error('\nFailed to parse JSON segment:', e.message);
        }
      }
      conn.end();
    });
  });
}).on('error', console.error).connect(SSH);
