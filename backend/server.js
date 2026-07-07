// backend/server.js
const path     = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const express  = require('express');
const cors     = require('cors');
const cookieParser = require('cookie-parser');
const jwt      = require('jsonwebtoken');
const connectDB = require('./db/mongoose');

// Connect to MongoDB
connectDB();

// Start Data Ingestion Scheduler
const { startScheduler } = require('./services/ingestionService');
startScheduler();

const app       = express();
const PORT      = process.env.BACKEND_PORT || 3001;

// â”€â”€ Middleware â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ API Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

    // â”€â”€ VIEW-AS MODE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Jika admin sedang dalam mode "View As Agent", frontend mengirim header
    // X-View-As-Agent berisi JWT token yang berisi agent_uuid yang dipilih.
    // Pendekatan header lebih reliable dari cookie karena melewati Next.js proxy.
    const viewAsHeader = req.headers['x-view-as-agent'];
    if (viewAsHeader && req.user.role === 'SUPER_ADMIN') {
      try {
        const viewDecoded = jwt.verify(viewAsHeader, JWT_SECRET);
        if (viewDecoded.type === 'view-as' && viewDecoded.adminId === req.user.id && viewDecoded.viewAs) {
          // Override: set role ke AGENT_VIEWER dan agent_uuid ke agent yang dipilih
          req.user = {
            ...req.user,
            role: 'AGENT_VIEWER',
            agent_uuid: viewDecoded.viewAs,
            _viewAsMode: true,
            _originalRole: 'SUPER_ADMIN',
          };
        }
      } catch (viewErr) {
        // Token view-as invalid/expired â€” abaikan, lanjut sebagai admin normal
        console.warn('[ViewAs] Invalid view-as token, ignoring:', viewErr.message);
      }
    }
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

const dashboardRoutes = require('./routes/dashboard');
app.use('/api/dashboard', requireAuth, dashboardRoutes);

// â”€â”€ Health Check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'BackOne Dashboard Backend berjalan!', time: new Date().toISOString() });
});


// â”€â”€ Start Server â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.listen(PORT, () => {
  console.log(`\nðŸš€ API Server berjalan di http://localhost:${PORT}`);
  console.log(`ðŸ”Œ API Health : http://localhost:${PORT}/api/health\n`);

});
