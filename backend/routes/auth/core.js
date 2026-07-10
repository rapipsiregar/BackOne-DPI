// backend/routes/auth/core.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const { makeToken, setCookieToken, requireAuth, JWT_SECRET } = require('./helpers');

const router = express.Router();

// ─── Auto-seed SUPER_ADMIN dan SOC_ANALYST jika belum ada ───────────────────────
(async () => {
  try {
    const count = await User.countDocuments({ role: 'SUPER_ADMIN' });
    if (count === 0) {
      const hash = bcrypt.hashSync('admin', 10);
      await User.create({
        username: 'admin',
        password_hash: hash,
        account_name: 'BackOne Administrator',
        role: 'SUPER_ADMIN',
        site_uuid: process.env.NETIFY_SITE_UUID || null,
        agent_uuid: null,
      });
      console.log('[Auth] ✓ Default SUPER_ADMIN created: admin / admin');
      console.log('[Auth] ⚠ GANTI PASSWORD INI SEGERA DI PRODUCTION!');
    }

    const analystCount = await User.countDocuments({ role: 'SOC_ANALYST' });
    if (analystCount === 0) {
      const hash = bcrypt.hashSync('analyst', 10);
      await User.create({
        username: 'analyst',
        password_hash: hash,
        account_name: 'BackOne SOC Analyst',
        role: 'SOC_ANALYST',
        site_uuid: process.env.NETIFY_SITE_UUID || null,
        agent_uuid: null,
      });
      console.log('[Auth] ✓ Default SOC_ANALYST created: analyst / analyst');
    }
  } catch (err) {
    console.warn('[Auth] Seed skipped (MongoDB not ready yet):', err.message);
  }
})();

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username, is_active: true }).select('+password_hash');
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = makeToken(user);
    setCookieToken(res, token);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        username: user.username,
        account_name: user.account_name,
        profile_picture: user.profile_picture,
        role: user.role,
        site_uuid: user.site_uuid,
        agent_uuid: user.agent_uuid,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/auth/renew ─────────────────────────────────────────────────────
router.post('/renew', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
    
    const token = makeToken(user);
    setCookieToken(res, token);
    
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({
      ok: true,
      message: 'Sesi berhasil diperpanjang',
      user: {
        id: user._id.toString(),
        username: user.username,
        account_name: user.account_name,
        profile_picture: user.profile_picture,
        role: user.role,
        site_uuid: user.site_uuid,
        agent_uuid: user.agent_uuid,
        iat: decoded.iat,
        exp: decoded.exp,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.json({ user: req.user });

    const isViewAs = req.user._viewAsMode;
    res.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        account_name: isViewAs ? req.user.agent_label : user.account_name,
        profile_picture: user.profile_picture,
        role: isViewAs ? 'AGENT_VIEWER' : user.role,
        site_uuid: user.site_uuid,
        agent_uuid: isViewAs ? req.user.agent_uuid : user.agent_uuid,
        _originalRole: isViewAs ? 'SUPER_ADMIN' : undefined,
        iat: req.user.iat,
        exp: req.user.exp,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// ─── GET /api/auth/geoip?ip=x.x.x.x ─────────────────────────────────────────
router.get('/geoip', async (req, res) => {
  const ip = req.query.ip;
  if (!ip) return res.status(400).json({ error: 'IP is required' });

  const parts = ip.split('.');
  if (parts.length === 4) {
    const [o1, o2] = parts.map(Number);
    if (o1 === 10 || (o1 === 192 && o2 === 168) || (o1 === 172 && o2 >= 16 && o2 <= 31) || o1 === 127 || (o1 === 169 && o2 === 254)) {
      return res.json({ ip_address: ip, isp: 'Intranet / Private Network', country: 'Local', city: 'Local', as_org: 'RFC 1918 Private Range' });
    }
  } else if (ip.startsWith('fe80:') || ip === '::1' || ip.startsWith('fd')) {
    return res.json({ ip_address: ip, isp: 'Intranet / Private Network', country: 'Local', city: 'Local', as_org: 'IPv6 Link-Local' });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`http://ip-api.com/json/${ip}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    const geo = await response.json();

    if (geo?.status === 'success') {
      return res.json({ ip_address: ip, isp: geo.isp || 'Unknown ISP', country: geo.country || 'Unknown', city: geo.city || 'Unknown', as_org: geo.as || geo.org || 'Unknown' });
    }
  } catch (e) { /* timeout or network error — fallback */ }

  res.json({ ip_address: ip, isp: 'Public IP', country: 'Remote', city: 'Remote', as_org: 'Public Network' });
});

module.exports = router;
