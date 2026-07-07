const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();

const script = `
set -e
export PATH=/home/adminbackend/node20/bin:$PATH

echo "=== 1. STOPPING PM2 PROCESSES ==="
npx pm2 delete all || true

echo "=== 2. BACKING UP DB & ENV ==="
mkdir -p /home/adminbackend/deploy_backup
cp /home/adminbackend/web/demoplace.my.id/public_html/.env.local /home/adminbackend/deploy_backup/.env.local || echo "No .env.local found"
cp /home/adminbackend/web/demoplace.my.id/public_html/backend/netify_data.db /home/adminbackend/deploy_backup/netify_data.db || echo "No DB found"
cp -r /home/adminbackend/web/demoplace.my.id/public_html/backend/uploads /home/adminbackend/deploy_backup/uploads || echo "No uploads found"

echo "=== 3. CLEARING TARGET DIRECTORY ==="
cd /home/adminbackend/web/demoplace.my.id/public_html
mkdir -p /home/adminbackend/trash
mv * /home/adminbackend/trash/ 2>/dev/null || true
mv .[^.]* /home/adminbackend/trash/ 2>/dev/null || true

echo "=== 4. EXTRACTING UPLOADED TARBALL ==="
tar -xzf /home/adminbackend/deploy.tar.gz -C .
rm -f /home/adminbackend/deploy.tar.gz

echo "=== 5. RESTORING BACKUP ==="
cp /home/adminbackend/deploy_backup/.env.local ./.env.local || true
mkdir -p backend
cp /home/adminbackend/deploy_backup/netify_data.db ./backend/netify_data.db || true
rm -rf ./backend/uploads || true
cp -r /home/adminbackend/deploy_backup/uploads ./backend/uploads || true

echo "=== 6. INSTALLING DEPS & BUILDING ==="
npm install --legacy-peer-deps
npm run build

echo "=== 6.5. CREATING NGINX SYMLINKS ==="
ln -sfn .next _next
ln -sfn public/backone-logo.png backone-logo.png
ln -sfn public/favicon.ico favicon.ico

echo "=== 7. STARTING PM2 ==="
PORT=10000 npx pm2 start npm --name "dpi-web" -- start
npx pm2 start backend/server.js --name "dpi-api"
npx pm2 save

echo "=== DEPLOYMENT SUCCESSFUL ==="
npx pm2 status
`;

conn.on('ready', () => {
  console.log('Connected to server. Uploading tarball...');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const readStream = fs.createReadStream('deploy.tar.gz');
    const writeStream = sftp.createWriteStream('/home/adminbackend/deploy.tar.gz');
    
    writeStream.on('close', () => {
      console.log('Upload complete. Executing deploy script...');
      conn.exec(script, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
          console.log('Deployment script finished with code ' + code);
          conn.end();
        }).on('data', (data) => {
          process.stdout.write(data);
        }).stderr.on('data', (data) => {
          process.stderr.write(data);
        });
      });
    });

    writeStream.on('error', (err) => {
      console.error('SFTP Error:', err);
      conn.end();
    });

    readStream.pipe(writeStream);
  });
}).on('error', (err) => {
  console.error('SSH Error:', err);
}).connect({
  host: '103.185.47.52',
  port: 2222,
  username: 'adminbackend',
  password: 'htEo7x6LsBQiEHHH',
  readyTimeout: 99999
});
