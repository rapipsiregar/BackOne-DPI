// ecosystem.config.js — PM2 Production Configuration for BackOne DPI
// Deploy with: pm2 start ecosystem.config.js --env production
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  apps: [
    // ─── 1. Proxy Server (Data Collector) ──────────────────────────────────
    {
      name: 'backone-proxy',
      script: './proxy/index.js',
      cwd: '/home/adminbackend/web/demoplace.my.id/public_html',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      node_args: '--max-old-space-size=1024',
      max_memory_restart: '1200M',
      restart_delay: 5000,
      max_restarts: 10,
      env_file: '.env.production',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/proxy-error.log',
      out_file: './logs/proxy-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },

    // ─── 2. Backend API Server (Express — Read-Only MongoDB) ───────────────
    {
      name: 'backone-backend',
      script: './backend/server.js',
      cwd: '/home/adminbackend/web/demoplace.my.id/public_html',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      node_args: '--max-old-space-size=256',
      max_memory_restart: '400M',
      restart_delay: 3000,
      max_restarts: 10,
      env_file: '.env.production',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },

    // ─── 3. Next.js Frontend (Standalone) ──────────────────────────────────
    {
      name: 'backone-frontend',
      script: 'start-with-env.js',
      cwd: '/home/adminbackend/web/demoplace.my.id/public_html',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      node_args: '--max-old-space-size=512',
      max_memory_restart: '700M',
      restart_delay: 3000,
      max_restarts: 10,
      env_file: '.env.production',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '127.0.0.1',
        NEXT_TELEMETRY_DISABLED: '1',
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
