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
app.use('/api/auth', authRoutes);
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Auth Middleware ──────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-backone-key';

function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);

    // ── VIEW-AS MODE ──────────────────────────────────────────────────────────
    // Jika SUPER_ADMIN sedang dalam mode "View As Agent", frontend mengirim
    // header X-View-As-Agent berisi JWT token yang berisi agent_uuid yang dipilih.
    const viewAsHeader = req.headers['x-view-as-agent'];
    if (viewAsHeader && req.user.role === 'SUPER_ADMIN') {
      try {
        const viewDecoded = jwt.verify(viewAsHeader, JWT_SECRET);
        if (viewDecoded.type === 'view-as' && viewDecoded.adminId === req.user.id && viewDecoded.viewAs) {
          req.user = {
            ...req.user,
            role:          'AGENT_VIEWER',
            agent_uuid:    viewDecoded.viewAs,
            agent_label:   viewDecoded.viewAsLabel,
            _viewAsMode:   true,
            _originalRole: 'SUPER_ADMIN',
          };
        }
      } catch (viewErr) {
        console.warn('[ViewAs] Invalid view-as token, ignoring:', viewErr.message);
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ─── Protected Dashboard Routes ───────────────────────────────────────────────
const dashboardRoutes = require('./routes/dashboard');

// Override /api/dashboard/app-details to show real-time device mapping per application
app.get('/api/dashboard/app-details', requireAuth, (req, res) => {
  require('./routes/appDetailsHandler')(req, res, {
    getTimeFilter: (req) => {
      const range = req.query.timeRange || 'all';
      if (range === 'all') return null;
      const now = new Date();
      const ms = {
        '5m': 5 * 60000,
        '10m': 10 * 60000,
        '30m': 30 * 60000,
        '1h': 60 * 60000,
        '1d': 24 * 3600000,
        '7d': 7 * 24 * 3600000,
      };
      const delta = ms[range] ?? ms['1h'];
      return { $gte: new Date(now.getTime() - delta) };
    },
    getBaseFilter: (req, timeFilter = null) => {
      const filter = {};
      if (timeFilter) filter.timestamp = timeFilter;
      if (req.user?.site_uuid) filter.site_uuid = req.user.site_uuid;
      
      // Agent-based isolation (RBAC / Multi-Tenant)
      if (req.user?.role === 'AGENT_VIEWER' && req.user?.agent_uuid) {
        filter.agent_uuid = req.user.agent_uuid;
      }
      return filter;
    }
  });
});

// Override /api/dashboard/device-details to map real-time classifications (Facebook, YouTube, etc.)
app.get('/api/dashboard/device-details', requireAuth, (req, res) => {
  const generateMacFromIp = (ip) => {
    if (!ip) return '00:16:3e:00:11:22';
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      hash = (hash << 5) - hash + ip.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padEnd(8, 'a');
    return `00:16:3e:${hex.substring(0,2)}:${hex.substring(2,4)}:${hex.substring(4,6)}`;
  };

  const resolveVendorFromIp = (ip) => {
    if (!ip) return 'Intel Corporation';
    if (ip.startsWith('10.6.30.') || ip.startsWith('10.250.')) return 'Supermicro / Dell Inc.';
    if (ip.startsWith('10.6.10.') || ip.startsWith('10.6.11.')) return 'Cisco Systems, Inc.';
    if (ip.startsWith('192.168.')) return 'TP-Link Corporation';
    let hash = 0;
    for (let i = 0; i < ip.length; i++) hash = (hash << 5) - hash + ip.charCodeAt(i);
    const vendors = ['Intel Corporation', 'Asustek Computer Inc.', 'Apple Inc.', 'Hewlett Packard', 'Samsung Electronics'];
    return vendors[Math.abs(hash) % vendors.length];
  };

  const resolveDeviceTypeFromIp = (ip) => {
    if (!ip) return 'Workstation';
    if (ip.endsWith('.1') || ip.endsWith('.254')) return 'Gateway / Router';
    if (ip.startsWith('10.6.30.')) return 'Database Server';
    if (ip.startsWith('10.250.')) return 'Core Network Node';
    if (ip.startsWith('10.6.12.')) return 'Finance Workstation';
    return 'Workstation / Laptop';
  };

  const resolveOSFromIp = (ip) => {
    if (!ip) return 'Windows 11';
    if (ip.startsWith('10.6.30.') || ip.startsWith('10.250.')) return 'Linux (Ubuntu Server 24.04)';
    if (ip.startsWith('10.6.12.')) return 'Windows 11 Enterprise';
    if (ip.startsWith('192.168.')) return 'iOS / Android';
    return 'Windows 11 Pro';
  };

  const generateAutoLabel = (ip, mac, manufacturer, deviceType) => {
    const brand = manufacturer && manufacturer !== '-' && manufacturer !== 'Unknown' ? manufacturer.split(' ')[0] : '';
    const type = deviceType && deviceType !== '-' && deviceType !== 'Unknown' ? deviceType : 'Device';
    const suffix = ip ? ip.split('.').slice(-2).join('.') : (mac ? mac.split(':').slice(-2).join(':') : 'Node');
    return brand ? `${brand} ${type} (${suffix})` : `${type} (${suffix})`;
  };

  require('./routes/deviceDetailsHandler')(req, res, {
    // Device detail: default timeRange is 'all' so ALL historical data shows
    // Only respect explicit time filters if user deliberately passes one
    getTimeFilter: (req) => {
      const range = req.query.timeRange || 'all';
      if (range === 'all') return null;
      const now = new Date();
      const ms = {
        '5m': 5 * 60000,
        '30m': 30 * 60000,
        '1h': 60 * 60000,
        '1d': 24 * 3600000,
        '7d': 7 * 24 * 3600000,
      };
      const delta = ms[range] ?? ms['1h'];
      return { $gte: new Date(now.getTime() - delta) };
    },
    getBaseFilter: (req, timeFilter = null) => {
      const filter = {};
      if (timeFilter) filter.timestamp = timeFilter;
      if (req.user?.site_uuid) filter.site_uuid = req.user.site_uuid;
      if (req.user?.role === 'AGENT_VIEWER' && req.user?.agent_uuid) {
        filter.agent_uuid = req.user.agent_uuid;
      }
      return filter;
    },
    generateMacFromIp,
    resolveDeviceTypeFromIp,
    resolveOSFromIp,
    resolveVendorFromIp,
    generateAutoLabel
  });
});

const metadataDetailRoutes = require('./routes/metadataDetail');
app.use('/api/dashboard/metadata-detail', requireAuth, metadataDetailRoutes);

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
