// backend/server.js
const path     = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const express  = require('express');
const cors     = require('cors');
const cookieParser = require('cookie-parser');
const jwt      = require('jsonwebtoken');

const app       = express();
const PORT      = process.env.BACKEND_PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ── API Routes ────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Auth Middleware for Dashboard
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-backone-key';
function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

const dashboardRoutes = require('./routes/dashboard');
app.use('/api/dashboard', requireAuth, dashboardRoutes);

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