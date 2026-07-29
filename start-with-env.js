// start-with-env.js
// ─────────────────────────────────────────────────────────────────────────────
// PM2 entry point untuk Next.js production server (Source 2)
// Memuat .env.production sebelum memulai Next.js standalone server
// ─────────────────────────────────────────────────────────────────────────────

const path = require('path');
const fs   = require('fs');

// Load .env.production variables into process.env
const envFile = path.join(__dirname, '.env.production');
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    const val = trimmed.substring(eqIdx + 1).trim();
    if (key) {
      process.env[key] = val; // Always overwrite — .env.production is the source of truth
    }
  }
  console.log('[start-with-env] ✓ Loaded .env.production');
} else {
  console.warn('[start-with-env] ⚠ .env.production not found, using existing env');
}

// Start Next.js standalone server
require('./.next/standalone/server.js');
