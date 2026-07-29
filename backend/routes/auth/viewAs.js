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

// POST /api/auth/admin/view-as — admin masuk mode "lihat sebagai agent"
router.post('/admin/view-as', requireAdmin, blockAnalyst, async (req, res) => {
  const { agent_uuid, agent_label } = req.body;
  if (!agent_uuid) return res.status(400).json({ ok: false, error: 'agent_uuid wajib diisi' });

  try {
    const viewToken = jwt.sign(
      {
        adminId: req.adminUser.id,
        adminUsername: req.adminUser.username,
        viewAs: agent_uuid,
        viewAsLabel: agent_label || agent_uuid,
        type: 'view-as'
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Simpan log audit ke MongoDB
    const ViewAsLog = mongoose.model('ViewAsLog');
    await new ViewAsLog({
      admin_id: req.adminUser.id,
      admin_username: req.adminUser.username,
      admin_role: req.adminUser.role, // Save role!
      agent_uuid,
      agent_label: agent_label || agent_uuid
    }).save();

    res.json({
      ok: true,
      message: `Sekarang melihat sebagai ${agent_label || agent_uuid}`,
      view_token: viewToken,
      agent_uuid,
      agent_label: agent_label || agent_uuid
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
