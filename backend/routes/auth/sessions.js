// backend/routes/auth/sessions.js
// ─────────────────────────────────────────────────────────────────────────────
// User Session Management Routes (Active Sessions & Remote Revocation)
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Session = require('../../models/Session');
const { requireAuth, requireAdmin } = require('./helpers');

// Helper to block SOC_ANALYST from write actions
function blockAnalyst(req, res, next) {
  if (req.adminUser.role === 'SOC_ANALYST') {
    return res.status(403).json({ ok: false, error: 'Aksi ini tidak diizinkan untuk peran SOC Analyst' });
  }
  next();
}

// ─── GET /api/auth/sessions (Current User Sessions) ──────────────────────────
router.get('/sessions', requireAuth, async (req, res) => {
  try {
    const sessions = await Session.find({ user_id: req.user.id }).sort({ last_active: -1 });
    
    const data = sessions.map(s => ({
      id: s._id.toString(),
      ip_address: s.ip_address,
      user_agent: s.user_agent,
      last_active: s.last_active,
      created_at: s.created_at,
      is_current: req.user.session_id === s._id.toString(),
    }));
    
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── DELETE /api/auth/sessions/:id (Revoke Current User Session) ──────────────
router.delete('/sessions/:id', requireAuth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ ok: false, error: 'Sesi tidak ditemukan' });
    }
    
    // Users can only revoke their own sessions
    if (session.user_id.toString() !== req.user.id) {
      return res.status(403).json({ ok: false, error: 'Aksi dilarang' });
    }
    
    await Session.findByIdAndDelete(req.params.id);
    
    // Clear cookies if the user revokes their own current session
    if (req.user.session_id === req.params.id) {
      res.clearCookie('token');
    }
    
    res.json({ ok: true, message: 'Sesi berhasil diakhiri' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── GET /api/auth/admin/sessions (Tenant/All Sessions) ──────────────────────
router.get('/admin/sessions', requireAdmin, async (req, res) => {
  try {
    let userQuery = {};
    if (req.adminUser.role === 'TENANT_ADMIN') {
      userQuery = { site_uuid: req.adminUser.site_uuid };
    }
    
    const users = await User.find(userQuery, 'username role account_name site_uuid');
    const userIds = users.map(u => u._id);
    
    const sessions = await Session.find({ user_id: { $in: userIds } })
      .populate('user_id', 'username role account_name site_uuid')
      .sort({ last_active: -1 });
      
    const data = sessions.map(s => {
      const u = s.user_id || {};
      return {
        id: s._id.toString(),
        username: u.username || 'Unknown',
        role: u.role || 'Unknown',
        account_name: u.account_name || 'Unknown',
        site_uuid: u.site_uuid || null,
        ip_address: s.ip_address,
        user_agent: s.user_agent,
        last_active: s.last_active,
        created_at: s.created_at,
        is_current: req.adminUser.session_id === s._id.toString(),
      };
    });
    
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── DELETE /api/auth/admin/sessions/:id (Revoke Any Session by Admin) ───────
router.delete('/admin/sessions/:id', requireAdmin, blockAnalyst, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('user_id');
    if (!session) {
      return res.status(404).json({ ok: false, error: 'Sesi tidak ditemukan' });
    }
    
    // Tenant Admin can only revoke sessions within their own site
    if (req.adminUser.role !== 'SUPER_ADMIN') {
      const sessionUser = session.user_id || {};
      if (sessionUser.site_uuid !== req.adminUser.site_uuid) {
        return res.status(403).json({ ok: false, error: 'Unauthorized: Sesi berada di luar site Anda' });
      }
    }
    
    await Session.findByIdAndDelete(req.params.id);
    res.json({ ok: true, message: 'Sesi berhasil diakhiri oleh administrator' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
