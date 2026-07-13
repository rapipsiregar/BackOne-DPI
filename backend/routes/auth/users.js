// backend/routes/auth/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const { requireAdmin, upload } = require('./helpers');

const router = express.Router();

// Helper to block SOC_ANALYST from write actions
function blockAnalyst(req, res, next) {
  if (req.adminUser.role === 'SOC_ANALYST') {
    return res.status(403).json({ ok: false, error: 'Aksi ini tidak diizinkan untuk peran SOC Analyst' });
  }
  next();
}

// GET /api/auth/admin/users — daftar semua users (admin & analyst)
router.get('/admin/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password_hash').sort({ created_at: 1 });
    const data = users.map(u => ({
      id: u._id.toString(),
      username: u.username,
      account_name: u.account_name,
      profile_picture: u.profile_picture,
      role: u.role,
      site_uuid: u.site_uuid,
      agent_uuid: u.agent_uuid,
      is_active: u.is_active,
    }));
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/auth/admin/create-agent-user — buat akun Network Agent baru
router.post('/admin/create-agent-user', requireAdmin, blockAnalyst, async (req, res) => {
  try {
    const { username, password, account_name, agent_uuid } = req.body;
    if (!username || !password) {
      return res.status(400).json({ ok: false, error: 'Username dan password wajib diisi' });
    }
    const passwordHash = bcrypt.hashSync(password, 10);
    const siteUuid = process.env.BACKONE_SITE_UUID || process.env.NETIFY_SITE_UUID || null;

    const newUser = await User.create({
      username: username.trim(),
      password_hash: passwordHash,
      account_name: account_name?.trim() || null,
      agent_uuid: agent_uuid?.trim() || null,
      role: 'AGENT_VIEWER',
      site_uuid: siteUuid,
    });

    res.json({ ok: true, message: 'Akun Network Agent berhasil dibuat', userId: newUser._id.toString() });
  } catch (err) {
    const msg = err.code === 11000 ? 'Username sudah digunakan' : err.message;
    res.status(400).json({ ok: false, error: msg });
  }
});

// POST /api/auth/admin/update-agent-user — update akun Network Agent
router.post('/admin/update-agent-user', requireAdmin, blockAnalyst, upload.single('profile_picture'), async (req, res) => {
  try {
    const { user_id, username, password, account_name, agent_uuid } = req.body;
    if (!user_id) return res.status(400).json({ ok: false, error: 'user_id wajib diisi' });

    const target = await User.findById(user_id).select('+password_hash');
    if (!target) return res.status(404).json({ ok: false, error: 'User tidak ditemukan' });
    if (target.role === 'SUPER_ADMIN') return res.status(403).json({ ok: false, error: 'Tidak bisa mengubah akun SUPER_ADMIN dari sini' });

    if (username?.trim()) {
      const existing = await User.findOne({ username: username.trim(), _id: { $ne: user_id } });
      if (existing) return res.status(400).json({ ok: false, error: 'Username sudah digunakan' });
      target.username = username.trim();
    }
    if (password) target.password_hash = bcrypt.hashSync(password, 10);
    if (account_name != null) target.account_name = account_name?.trim() || null;
    if (agent_uuid != null) target.agent_uuid = agent_uuid?.trim() || null;
    if (req.file) target.profile_picture = req.file.filename;

    await target.save();
    const updated = await User.findById(user_id, '-password_hash');
    res.json({ ok: true, message: 'Akun berhasil diperbarui', user: updated });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/auth/admin/delete-agent-user/:id — hapus akun Network Agent
router.delete('/admin/delete-agent-user/:id', requireAdmin, blockAnalyst, async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ ok: false, error: 'User tidak ditemukan' });
    if (target.role === 'SUPER_ADMIN') return res.status(403).json({ ok: false, error: 'Tidak bisa menghapus SUPER_ADMIN' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ ok: true, message: 'Akun berhasil dihapus' });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// POST /api/auth/admin/upload-agent-picture/:id — upload foto profil agent oleh admin
router.post('/admin/upload-agent-picture/:id', requireAdmin, blockAnalyst, upload.single('profile_picture'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: 'File gambar wajib diupload' });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ ok: false, error: 'User tidak ditemukan' });
    target.profile_picture = req.file.filename;
    await target.save();
    res.json({ ok: true, message: 'Foto profil berhasil diperbarui', filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/auth/admin/create-external-user — buat akun Eksternal (SOC Analyst, Engineer, dll)
router.post('/admin/create-external-user', requireAdmin, blockAnalyst, upload.single('profile_picture'), async (req, res) => {
  try {
    const { username, password, account_name, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ ok: false, error: 'Username, password, dan role wajib diisi' });
    }
    
    // Validasi role (hanya boleh role tertentu, tidak boleh SUPER_ADMIN baru atau AGENT_VIEWER)
    const validRoles = ['SOC_ANALYST', 'ENGINEER', 'TENANT_ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ ok: false, error: 'Role tidak valid untuk pembuatan akun eksternal' });
    }

    const existing = await User.findOne({ username: username.trim() });
    if (existing) {
      return res.status(400).json({ ok: false, error: 'Username sudah digunakan' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const siteUuid = process.env.BACKONE_SITE_UUID || process.env.NETIFY_SITE_UUID || null;

    const newUser = await User.create({
      username: username.trim(),
      password_hash: passwordHash,
      account_name: account_name?.trim() || null,
      role: role,
      site_uuid: siteUuid,
      profile_picture: req.file ? req.file.filename : null
    });

    res.json({ ok: true, message: 'Akun eksternal berhasil dibuat', userId: newUser._id.toString() });
  } catch (err) {
    const msg = err.code === 11000 ? 'Username sudah digunakan' : err.message;
    res.status(400).json({ ok: false, error: msg });
  }
});

module.exports = router;
