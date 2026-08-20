#!/bin/bash
# =============================================================================
# deploy-server-setup.sh
# Script yang dijalankan di server setelah file di-upload
# Path: /home/adminbackend/web/dev.demoplace.my.id/public_html/
# =============================================================================

set -e
DEPLOY_DIR="/home/adminbackend/web/dev.demoplace.my.id/public_html"
cd "$DEPLOY_DIR"

echo "=== [1/6] Checking environment ==="
node --version
npm --version
npx -y pm2 --version

echo ""
echo "=== [2/6] Installing backend dependencies ==="
cd "$DEPLOY_DIR/backend"
npm install --omit=dev --legacy-peer-deps
cd "$DEPLOY_DIR"

echo ""
echo "=== [3/6] Installing proxy dependencies ==="
cd "$DEPLOY_DIR/proxy"
npm install --omit=dev --legacy-peer-deps
cd "$DEPLOY_DIR"

echo ""
echo "=== [4/6] Creating required directories and symlinks ==="
mkdir -p logs
mkdir -p scratch
if [ -d _next ] && [ ! -L _next ]; then
  echo "Removing old physical _next directory..."
  rm -rf _next
fi
echo "Ensuring _next is a symlink to .next..."
ln -sf .next _next

echo ""
echo "=== [5/6] Stopping old PM2 processes (if any) ==="
npx -y pm2 delete source2-proxy   2>/dev/null || echo "source2-proxy: not running"
npx -y pm2 delete source2-backend 2>/dev/null || echo "source2-backend: not running"
npx -y pm2 delete source2-frontend 2>/dev/null || echo "source2-frontend: not running"

echo ""
echo "=== [6/6] Starting PM2 processes ==="
npx -y pm2 start ecosystem.config.js --env production
npx -y pm2 save
npx -y pm2 list

echo ""
echo "=== DEPLOY COMPLETE ==="
echo "Frontend  : http://127.0.0.1:3010"
echo "Backend   : http://127.0.0.1:3011"
echo "Proxy     : http://127.0.0.1:4010"
echo ""
echo "Check logs with: pm2 logs source2-backend --lines 30"
