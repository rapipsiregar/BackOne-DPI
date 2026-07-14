// backend/server.js
// ─────────────────────────────────────────────────────────────────────────────
// BackOne Backend API Server
//
// Tanggung jawab backend ini adalah READ-ONLY dari MongoDB.
// Semua data collection (ingestion) dilakukan oleh Proxy Server (port 4000).
// Backend TIDAK memanggil DPI API secara langsung.
//
// Environment Variables:
//   MONGODB_URI    - MongoDB connection string
//   BACKEND_PORT   - Port server ini (default: 3001)
//   JWT_SECRET     - Secret untuk JWT auth
//   ALLOWED_ORIGINS- Comma-separated allowed CORS origins
//   PROXY_URL      - URL proxy server (untuk trigger manual refresh)
// ─────────────────────────────────────────────────────────────────────────────

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const express     = require('express');
const cors        = require('cors');
const cookieParser = require('cookie-parser');
const jwt         = require('jsonwebtoken');
const connectDB   = require('./db/mongoose');

// ─── Connect to MongoDB (read-only mode) ──────────────────────────────────────
connectDB();

const app  = express();
const PORT = process.env.BACKEND_PORT || 3001;

// ─── Middleware ────────────────────────────────────────────────────────────────
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

// ─── Public Routes ────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const { getUploadsDir } = require('./routes/auth/helpers');
app.use('/api/auth', authRoutes);
app.use('/api/uploads', express.static(getUploadsDir()));

// ─── Auth Middleware ──────────────────────────────────────────────────────────
const { requireAuth } = require('./middleware/auth');
const { getTimeFilter, getBaseFilter } = require('./routes/dashboard/helpers');
const {
  generateMacFromIp,
  resolveVendorFromIp,
  resolveDeviceTypeFromIp,
  resolveOSFromIp,
  generateAutoLabel
} = require('./deviceResolver');

// ─── Protected Dashboard Routes ───────────────────────────────────────────────
const dashboardRoutes = require('./routes/dashboard');

// Override /api/dashboard/app-details to show real-time device mapping per application
app.get('/api/dashboard/app-details', requireAuth, (req, res) => {
  require('./routes/appDetailsHandler')(req, res, {
    getTimeFilter,
    getBaseFilter
  });
});

// Override /api/dashboard/device-details to map real-time classifications (Facebook, YouTube, etc.)
app.get('/api/dashboard/device-details', requireAuth, (req, res) => {
  require('./routes/deviceDetailsHandler')(req, res, {
    getTimeFilter,
    getBaseFilter,
    generateMacFromIp,
    resolveDeviceTypeFromIp,
    resolveOSFromIp,
    resolveVendorFromIp,
    generateAutoLabel
  });
});

app.get('/api/dashboard/remote-ip-details', requireAuth, async (req, res) => {
  require('./routes/remoteIpDetailsHandler')(req, res, {
    getTimeFilter
  });
});

const metadataDetailRoutes = require('./routes/metadataDetail');
app.use('/api/dashboard/metadata-detail', requireAuth, metadataDetailRoutes);

const categoryDetailRoutes = require('./routes/categoryDetail');
app.use('/api/dashboard/category-detail', requireAuth, categoryDetailRoutes);

app.use('/api/dashboard', requireAuth, dashboardRoutes);




// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'BackOne Backend berjalan (MongoDB read-only mode)',
    time: new Date().toISOString()
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 BackOne API Server berjalan di http://localhost:${PORT}`);
  console.log(`🔌 API Health : http://localhost:${PORT}/api/health`);
  console.log(`📡 Mode       : READ-ONLY dari MongoDB (data dikirim oleh Proxy Server)\n`);
});
