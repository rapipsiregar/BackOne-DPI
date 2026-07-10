// backend/routes/auth/helpers.js
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-backone-key';

function makeToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      username: user.username,
      account_name: user.account_name,
      profile_picture: user.profile_picture,
      role: user.role,
      site_uuid: user.site_uuid,
      agent_uuid: user.agent_uuid,
    },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
}

function setCookieToken(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
  });
}

function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);

    // ── VIEW-AS MODE ──────────────────────────────────────────────────────────
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
    next();
  } catch {
    res.status(401).json({ error: 'Token tidak valid' });
  }
}

function requireAdmin(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'SUPER_ADMIN' && decoded.role !== 'TENANT_ADMIN' && decoded.role !== 'SOC_ANALYST') {
      return res.status(403).json({ error: 'Role Anda tidak memiliki izin untuk melakukan aksi ini (Hanya Administrator / Analyst)' });
    }
    req.adminUser = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token tidak valid' });
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

module.exports = {
  JWT_SECRET,
  makeToken,
  setCookieToken,
  requireAuth,
  requireAdmin,
  upload
};
