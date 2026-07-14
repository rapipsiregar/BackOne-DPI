// backend/routes/auth/core.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const { makeToken, setCookieToken, requireAuth, JWT_SECRET } = require('./helpers');

const { TenantConfig, CustomAgentLocation } = require('../../models/Schemas');

const router = express.Router();

// ─── Auto-seed SUPER_ADMIN, SOC_ANALYST, dan TENANT_ADMIN jika belum ada ─────────
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

    const siabCount = await User.countDocuments({ username: 'siab' });
    if (siabCount === 0) {
      const hash = bcrypt.hashSync('siab', 10);
      await User.create({
        username: 'siab',
        password_hash: hash,
        account_name: 'SIAB Administrator',
        role: 'TENANT_ADMIN',
        site_uuid: '6681452d_9cae_4ff4_8ae8_0d504774265e',
        agent_uuid: null,
      });
      console.log('[Auth] ✓ Default SIAB Tenant created: siab / siab');
    }

    const nexusCount = await User.countDocuments({ username: 'nexus' });
    if (nexusCount === 0) {
      const hash = bcrypt.hashSync('nexus', 10);
      await User.create({
        username: 'nexus',
        password_hash: hash,
        account_name: 'Nexus Administrator',
        role: 'TENANT_ADMIN',
        site_uuid: 'd7902405_0dc2_458b_8584_ed4d24b64f24',
        agent_uuid: null,
      });
      console.log('[Auth] ✓ Default Nexus Tenant created: nexus / nexus');
    }

    // Repair/Migration: Ensure legacy users have appropriate created_by values
    try {
      const missingCreatedBy = await User.find({ $or: [{ created_by: { $exists: false } }, { created_by: null }] });
      if (missingCreatedBy.length > 0) {
        console.log(`[Auth] Migrating ${missingCreatedBy.length} legacy users to set created_by...`);
        for (const u of missingCreatedBy) {
          if (u.username === 'admin') {
            u.created_by = 'admin';
          } else if (u.site_uuid === '6681452d_9cae_4ff4_8ae8_0d504774265e') {
            u.created_by = 'siab';
          } else if (u.site_uuid === 'd7902405_0dc2_458b_8584_ed4d24b64f24') {
            u.created_by = 'nexus';
          } else {
            u.created_by = 'admin';
          }
          await u.save();
        }
        console.log(`[Auth] Migration complete.`);
      }
    } catch (migrateErr) {
      console.error('[Auth] Migration failed:', migrateErr.message);
    }

    const defaultConfigs = [
      {
        site_uuid: 'default',
        brand_name: 'BackOne',
        brand_logo: '/backone-logo.png',
        footer_copyright: 'PT. Data Bisnis Solusi',
        primary_color: '#E11D48',
      },
      {
        site_uuid: '6681452d_9cae_4ff4_8ae8_0d504774265e',
        brand_name: 'SIAB',
        brand_logo: '/siab-logo.png',
        footer_copyright: 'PT. SIAB Indonesia',
        primary_color: '#3B82F6',
      },
      {
        site_uuid: 'd7902405_0dc2_458b_8584_ed4d24b64f24',
        brand_name: 'Nexus',
        brand_logo: '/nexus-logo.png',
        footer_copyright: 'PT. Nexus Solusi',
        primary_color: '#8B5CF6',
      }
    ];

    for (const config of defaultConfigs) {
      const existing = await TenantConfig.findOne({ site_uuid: config.site_uuid });
      if (!existing) {
        await TenantConfig.create(config);
        console.log(`[Auth] ✓ Seeded TenantConfig for: ${config.brand_name}`);
      }
    }

    // Seed default agent locations
    const defaultLocations = [
      {
        agent_uuid: 'F6-2V-DT-8A',
        site_uuid: '6681452d_9cae_4ff4_8ae8_0d504774265e',
        latitude: -6.2263304,
        longitude: 106.4247322,
        label: 'CPI Balaraja Agent Office'
      },
      {
        agent_uuid: '2F-TF-1D-GK',
        site_uuid: '6681452d_9cae_4ff4_8ae8_0d504774265e',
        latitude: -6.3763318,
        longitude: 106.8983017,
        label: 'JRP Cibubur Agent Office'
      },
      {
        agent_uuid: '8A-V3-PB-85',
        site_uuid: '6681452d_9cae_4ff4_8ae8_0d504774265e',
        latitude: -6.2253265,
        longitude: 106.8061484,
        label: 'IFG LT.18 Agent HQ'
      }
    ];

    for (const loc of defaultLocations) {
      const existing = await CustomAgentLocation.findOne({ agent_uuid: loc.agent_uuid });
      if (!existing) {
        await CustomAgentLocation.create(loc);
        console.log(`[Auth] ✓ Seeded CustomAgentLocation for: ${loc.agent_uuid}`);
      }
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
