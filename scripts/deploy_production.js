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

const DEPLOY_DIR = 'web/demoplace.my.id/public_html';

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
    archive.directory(path.join(__dirname, '../public'), false);
    
    // Add backend and proxy
    archive.directory(path.join(__dirname, '../backend'), 'backend');
    archive.directory(path.join(__dirname, '../proxy'), 'proxy');
    
    // Add PM2 ecosystem config
    archive.file(path.join(__dirname, '../ecosystem.config.js'), { name: 'ecosystem.config.js' });
    
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
    await runSSH(`cd ${targetDir} && rm -rf .next && unzip -o deploy.zip && rm deploy.zip`);
    
    console.log("Creating symlink for static files...");
    await runSSH(`cd ${targetDir} && rm -rf _next && ln -s .next _next`);
    
    console.log("Installing production dependencies for root, backend & proxy...");
    await runSSH(`. ~/.nvm/nvm.sh && nvm use 20 && cd ${targetDir} && npm install --production`);
    await runSSH(`. ~/.nvm/nvm.sh && nvm use 20 && cd ${targetDir}/backend && npm install --production`);
    await runSSH(`. ~/.nvm/nvm.sh && nvm use 20 && cd ${targetDir}/proxy && npm install --production`);

    console.log("Configuring PM2...");
    // PM2 ecosystem is now packaged in deploy.zip directly, no need to generate via bash echo.
    
    
    console.log("Restarting PM2 processes...");
    // Clean delete old PM2 processes if they exist to apply new paths, then start fresh
    await runSSH(`. ~/.nvm/nvm.sh && nvm use 20 && npx pm2 delete backone-frontend backone-backend backone-proxy || true`);
    const pm2Result = await runSSH(`. ~/.nvm/nvm.sh && nvm use 20 && cd ${targetDir} && npx pm2 start ecosystem.config.js`);
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
