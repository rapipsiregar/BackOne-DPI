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
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy (Unauthorized Origin)'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// ── API Routes ────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

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
  res.json({ ok: true, message: 'BackOne Dashboard Backend berjalan!', time: new Date().toISOString() });
});


// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 API Server berjalan di http://localhost:${PORT}`);
  console.log(`🔌 API Health : http://localhost:${PORT}/api/health\n`);

  // Mulai scheduler polling
  const { startScheduler } = require('./scheduler');
  startScheduler();
});