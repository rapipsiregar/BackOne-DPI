const { Client } = require('ssh2');
const SftpClient = require('ssh2-sftp-client');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

const config = {
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH'
};

const DEPLOY_DIR = 'backone-production';

async function createZip() {
  console.log("Packaging application...");
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(path.join(__dirname, '../deploy.zip'));
    const archive = new archiver.ZipArchive({ zlib: { level: 9 } });

    output.on('close', () => resolve(path.join(__dirname, '../deploy.zip')));
    archive.on('error', (err) => reject(err));

    archive.pipe(output);

    // Add standalone output
    archive.directory(path.join(__dirname, '../.next/standalone'), false);
    
    // Add static assets (Next.js standalone requires these copied over)
    archive.directory(path.join(__dirname, '../.next/static'), '.next/static');
    archive.directory(path.join(__dirname, '../public'), 'public');
    
    // Add backend and proxy
    archive.directory(path.join(__dirname, '../backend'), 'backend');
    archive.directory(path.join(__dirname, '../proxy'), 'proxy');
    
    // Add production env
    archive.file(path.join(__dirname, '../.env.production'), { name: '.env.production' });
    
    archive.finalize();
  });
}

async function runSSH(cmd) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) return reject(err);
        let out = '';
        stream.on('close', (code, signal) => {
          conn.end();
          resolve(out);
        }).on('data', (data) => {
          out += data;
        }).stderr.on('data', (data) => {
          out += data;
        });
      });
    }).on('error', reject).connect(config);
  });
}

async function deploy() {
  const sftp = new SftpClient();
  let zipPath;
  try {
    zipPath = await createZip();
    console.log("Package created successfully.");

    console.log("Connecting to SFTP server...");
    await sftp.connect(config);
    
    console.log("Creating deployment directory...");
    const homeDir = await runSSH('pwd');
    const targetDir = `${homeDir.trim()}/${DEPLOY_DIR}`;
    await runSSH(`mkdir -p ${targetDir}`);

    console.log(`Uploading deploy.zip to ${targetDir}...`);
    await sftp.put(zipPath, `${targetDir}/deploy.zip`);
    
    console.log("Extracting package on server...");
    await runSSH(`cd ${targetDir} && unzip -o deploy.zip && rm deploy.zip`);
    
    console.log("Installing production dependencies for backend & proxy...");
    await runSSH(`cd ${targetDir}/backend && npm install --production`);
    await runSSH(`cd ${targetDir}/proxy && npm install --production`);

    console.log("Configuring PM2...");
    // Create ecosystem file for PM2
    const ecosystem = `
module.exports = {
  apps: [
    { name: 'backone-proxy', script: './proxy/index.js', env_file: '.env.production' },
    { name: 'backone-backend', script: './backend/server.js', env_file: '.env.production' },
    { name: 'backone-frontend', script: 'server.js', env_file: '.env.production' }
  ]
};`;
    await runSSH(`cd ${targetDir} && echo "${ecosystem.replace(/\n/g, '\\n')}" > ecosystem.config.js`);
    
    console.log("Restarting PM2 processes...");
    const pm2Result = await runSSH(`cd ${targetDir} && pm2 start ecosystem.config.js || pm2 restart ecosystem.config.js`);
    console.log(pm2Result);
    
    console.log("Deployment completed successfully!");
    console.log(`BackOne Dashboard is now live. Please map your Nginx/Apache domain demoplace.my.id to http://127.0.0.1:3000`);
    
  } catch(e) {
    console.error("Deployment failed:", e.message);
  } finally {
    sftp.end();
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  }
}

deploy();
