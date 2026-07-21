// backend/routes/auth/core.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const { makeToken, setCookieToken, requireAuth, JWT_SECRET } = require('./helpers');

const { TenantConfig, CustomAgentLocation } = require('../../models/Schemas');

const router = express.Router();

// ─── Auto-seed database records if empty ──────────────────────────────────────
const seedAuth = require('./seed');
seedAuth();

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username, is_active: true }).select('+password_hash');
    if (!user) {
      return res.status(401).json({ error: 'Username not found' });
    }

    // Check if account is currently locked out
    if (user.lockout_until && user.lockout_until > new Date()) {
      const remainingTime = Math.ceil((user.lockout_until - new Date()) / 60000);
      return res.status(403).json({ error: `Account is temporarily locked. Please try again in ${remainingTime} minute(s).` });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      user.login_attempts = (user.login_attempts || 0) + 1;
      if (user.login_attempts >= 3) {
        user.lockout_until = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lockout
        await user.save();
        return res.status(403).json({ error: 'Account is temporarily locked. Please try again in 15 minute(s).' });
      } else {
        await user.save();
        return res.status(401).json({ error: 'Invalid Password' });
      }
    }

    // Reset login attempts on successful login
    user.login_attempts = 0;
    user.lockout_until = null;
    await user.save();

    // Create session in MongoDB
    const Session = require('../../models/Session');
    const crypto = require('crypto');
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // 1 day session lifetime

    const newSession = await Session.create({
      user_id: user._id,
      ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown',
      user_agent: req.headers['user-agent'] || 'Unknown',
      session_token: sessionToken,
      expires_at: expiresAt,
    });

    const token = makeToken(user, newSession._id);
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

    const sessionId = req.user.session_id;
    if (sessionId) {
      const Session = require('../../models/Session');
      const session = await Session.findById(sessionId);
      if (session) {
        // Extend session expires_at in MongoDB by another 24h
        session.expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await session.save();
      }
    }
    
    const token = makeToken(user, sessionId);
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
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const sessionId = req.user?.session_id;
    if (sessionId) {
      const Session = require('../../models/Session');
      await Session.findByIdAndDelete(sessionId);
    }
  } catch (err) {
    console.error('[Logout] Session deletion failed:', err.message);
  }
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
