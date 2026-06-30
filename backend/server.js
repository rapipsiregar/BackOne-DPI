// backend/server.js
const path     = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const express  = require('express');
const cors     = require('cors');

const app       = express();
const PORT      = process.env.BACKEND_PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── API Routes ────────────────────────────────────────────────────────────────
const dashboardRoutes = require('./routes/dashboard');
app.use('/api/dashboard', dashboardRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Netify Dashboard Backend berjalan!', time: new Date().toISOString() });
});


// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 API Server berjalan di http://localhost:${PORT}`);
  console.log(`🔌 API Health : http://localhost:${PORT}/api/health\n`);

  // Mulai scheduler polling
  const { startScheduler } = require('./scheduler');
  startScheduler();
});