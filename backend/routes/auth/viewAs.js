// backend/routes/auth/viewAs.js
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { requireAdmin, requireAuth, JWT_SECRET } = require('./helpers');

const router = express.Router();

// Block SOC_ANALYST from starting view-as sessions; EXECUTIVE is allowed (read-only viewer)
function blockAnalyst(req, res, next) {
  if (req.adminUser.role === 'SOC_ANALYST') {
    return res.status(403).json({ ok: false, error: 'Aksi ini tidak diizinkan untuk peran SOC Analyst' });
  }
  next();
}

// POST /api/auth/admin/view-as — admin masuk mode "lihat sebagai user/agent"
router.post('/admin/view-as', requireAdmin, blockAnalyst, async (req, res) => {
  const { agent_uuid, agent_label, target_user_id, target_username, target_role } = req.body;
  if (!agent_uuid) return res.status(400).json({ ok: false, error: 'agent_uuid wajib diisi' });

  try {
    const ViewAsLog = mongoose.model('ViewAsLog');
    const User = mongoose.model('User');

    let targetUserDoc = null;
    if (target_user_id) {
      targetUserDoc = await User.findById(target_user_id).lean();
    } else if (target_username) {
      targetUserDoc = await User.findOne({ username: target_username }).lean();
    }

    const payload = {
      adminId: req.adminUser.id,
      adminUsername: req.adminUser.username,
      viewAs: agent_uuid,
      viewAsLabel: agent_label || agent_uuid,
      target_user_id: targetUserDoc ? (targetUserDoc.id || targetUserDoc._id) : (target_user_id || null),
      target_username: targetUserDoc ? targetUserDoc.username : (target_username || null),
      target_role: targetUserDoc ? targetUserDoc.role : (target_role || null),
      type: 'view-as'
    };

    const viewToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    // Simpan log audit lengkap ke MongoDB
    await new ViewAsLog({
      admin_id: req.adminUser.id,
      admin_username: req.adminUser.username,
      admin_role: req.adminUser.role,
      target_user_id: payload.target_user_id,
      target_username: payload.target_username,
      target_role: payload.target_role,
      agent_uuid,
      agent_label: agent_label || agent_uuid
    }).save();

    res.json({
      ok: true,
      message: `Sekarang melihat sebagai ${payload.target_username || agent_label || agent_uuid}`,
      view_token: viewToken,
      agent_uuid,
      agent_label: agent_label || agent_uuid,
      target_user_id: payload.target_user_id,
      target_username: payload.target_username,
      target_role: payload.target_role
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/auth/admin/view-as/logs — ambil riwayat audit view-as
router.get('/admin/view-as/logs', requireAdmin, async (req, res) => {
  try {
    const ViewAsLog = mongoose.model('ViewAsLog');
    
    // Role-based visibility logic:
    const query = {};
    if (req.adminUser.role === 'SOC_ANALYST') {
      query.admin_role = { $ne: 'SUPER_ADMIN' };
      query.admin_username = { $ne: 'admin' };
    } else if (req.adminUser.role === 'TENANT_ADMIN') {
      const Summary = mongoose.model('Summary');
      const siteAgents = await Summary.distinct('agent_uuid', { site_uuid: req.adminUser.site_uuid });
      query.agent_uuid = { $in: siteAgents };
      query.admin_role = { $ne: 'SUPER_ADMIN' };
      query.admin_username = { $ne: 'admin' };
    } else if (req.adminUser.role === 'COMPANY_ADMIN' || req.adminUser.role === 'COMPANY_OPERATOR') {
      // COMPANY_ADMIN/OPERATOR hanya lihat log mereka sendiri
      query.admin_id = req.adminUser.id;
    }

    const logs = await ViewAsLog.find(query).sort({ timestamp: -1 }).lean();
    res.json({ ok: true, data: logs });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/auth/admin/view-as — keluar dari mode view-as
router.delete('/admin/view-as', requireAdmin, async (req, res) => {
  try {
    const ViewAsLog = mongoose.model('ViewAsLog');
    const latestLog = await ViewAsLog.findOne({
      admin_id: req.adminUser.id,
      end_timestamp: { $exists: false }
    }).sort({ timestamp: -1 });

    if (latestLog) {
      latestLog.end_timestamp = new Date();
      const diffMs = latestLog.end_timestamp.getTime() - latestLog.timestamp.getTime();
      latestLog.duration = Math.round(diffMs / 1000); // durasi dalam detik
      await latestLog.save();
    }
  } catch (err) {
    console.error("Gagal menyimpan durasi sesi view-as:", err.message);
  }

  res.clearCookie('view_as_token');
  res.json({ ok: true, message: 'Kembali ke tampilan admin' });
});

// GET /api/auth/view-as — cek status view-as
router.get('/view-as', requireAuth, (req, res) => {
  const viewToken = req.cookies?.view_as_token;
  if (!viewToken) return res.json({ active: false });
  try {
    const decoded = jwt.verify(viewToken, JWT_SECRET);
    res.json({ active: true, agent_uuid: decoded.viewAs, agent_label: decoded.viewAsLabel });
  } catch {
    res.clearCookie('view_as_token');
    res.json({ active: false });
  }
});

module.exports = router;
