// backend/server.js
// ─────────────────────────────────────────────────────────────────────────────
// Polyfill global crypto for Node 18 compatibility (required by mongodb driver)
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = require('crypto');
}

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
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
require('dotenv').config({ path: path.join(__dirname, '..', envFile) });

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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
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

// ─── Global JSON Error Handler ────────────────────────────────────────────────
// Menangkap semua error yang tidak di-handle (termasuk multer, mongoose, dll.)
// dan memastikan response selalu JSON, BUKAN HTML default Express.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]', err.message || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    code: err.code || undefined,
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
// Bind to 127.0.0.1 in production to prevent direct external access to port 3001.
// All external traffic must go through the reverse proxy (Apache/Nginx) at port 80/443.
const BIND_HOST = process.env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0';
app.listen(PORT, BIND_HOST, () => {
  console.log(`\n🚀 BackOne API Server berjalan di http://${BIND_HOST}:${PORT}`);
  console.log(`🔌 API Health : http://${BIND_HOST}:${PORT}/api/health`);
  console.log(`📡 Mode       : READ-ONLY dari MongoDB (data dikirim oleh Proxy Server)`);
  console.log(`🔒 Security   : Bound to ${BIND_HOST} (internal only in production)\n`);
});
