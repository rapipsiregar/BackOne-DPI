// backend/routes/auth/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const { requireAdmin, upload } = require('./helpers');
const { blockAnalyst, resolveSiteUuidForAgent, mapUserData } = require('./usersHelper');
const { handleCreateExternalUser } = require('./usersCreateExternal');

const router = express.Router();

// GET /api/auth/admin/users — daftar semua users (admin & analyst)
router.get('/admin/users', requireAdmin, async (req, res) => {
  try {
    let query = {};
    if (req.adminUser.role === 'TENANT_ADMIN') {
      query = {
        $or: [
          { role: 'AGENT_VIEWER', site_uuid: req.adminUser.site_uuid },
          { created_by: req.adminUser.username }
        ]
      };
    } else if (req.adminUser.role === 'COMPANY_ADMIN') {
      query = { company_name: req.adminUser.company_name };
      const users = await User.find(query, '-password_hash').sort({ created_at: 1 });
      return res.json({ ok: true, data: users.map(mapUserData) });
    }
    query.username = { $ne: req.adminUser.username };
    const users = await User.find(query, '-password_hash').sort({ created_at: 1 });
    res.json({ ok: true, data: users.map(mapUserData) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/auth/admin/unlock-user — unlock akun yang terkunci
router.post('/admin/unlock-user', requireAdmin, blockAnalyst, async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ ok: false, error: 'user_id wajib diisi' });

    const target = await User.findById(user_id);
    if (!target) return res.status(404).json({ ok: false, error: 'User tidak ditemukan' });
    
    if (req.adminUser.role !== 'SUPER_ADMIN' && target.site_uuid !== req.adminUser.site_uuid) {
      return res.status(403).json({ ok: false, error: 'Unauthorized: Account does not belong to your tenant.' });
    }

    target.login_attempts = 0;
    target.lockout_until = null;
    await target.save();

    res.json({ ok: true, message: 'Akun berhasil di-unlock' });
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
    const siteUuid = await resolveSiteUuidForAgent(agent_uuid, null, req.adminUser, req.body.site_uuid);

    const newUser = await User.create({
      username: username.trim(),
      password_hash: passwordHash,
      account_name: account_name?.trim() || null,
      agent_uuid: agent_uuid?.trim() || null,
      role: 'AGENT_VIEWER',
      site_uuid: siteUuid,
      created_by: req.adminUser.username,
    });

    res.json({ ok: true, message: 'Akun Network Agent berhasil dibuat', userId: newUser._id.toString() });
  } catch (err) {
    const msg = err.code === 11000 ? 'Username sudah digunakan' : err.message;
    res.status(400).json({ ok: false, error: msg });
  }
});

// POST /api/auth/admin/update-agent-user — update akun Network Agent / Company User
router.post('/admin/update-agent-user', requireAdmin, blockAnalyst, async (req, res) => {
  try {
    const { user_id, username, password, account_name, agent_uuid, company_name } = req.body;
    let agent_uuids = null;
    if (req.body.agent_uuids) {
      try {
        agent_uuids = typeof req.body.agent_uuids === 'string' ? JSON.parse(req.body.agent_uuids) : req.body.agent_uuids;
      } catch {
        agent_uuids = [req.body.agent_uuids];
      }
    }

    if (!user_id) return res.status(400).json({ ok: false, error: 'user_id wajib diisi' });

    const target = await User.findById(user_id).select('+password_hash');
    if (!target) return res.status(404).json({ ok: false, error: 'User tidak ditemukan' });
    if (target.role === 'SUPER_ADMIN') return res.status(403).json({ ok: false, error: 'Tidak bisa mengubah akun SUPER_ADMIN dari sini' });
    
    if (req.adminUser.role === 'COMPANY_ADMIN') {
      if (target.company_name !== req.adminUser.company_name) {
        return res.status(403).json({ ok: false, error: 'Access Denied: Akun ini bukan milik perusahaan Anda.' });
      }
    } else if (req.adminUser.role !== 'SUPER_ADMIN' && target.site_uuid !== req.adminUser.site_uuid) {
      return res.status(403).json({ ok: false, error: 'Unauthorized: This account does not belong to your tenant.' });
    }

    if (username?.trim()) {
      const existing = await User.findOne({ username: username.trim(), _id: { $ne: user_id } });
      if (existing) return res.status(400).json({ ok: false, error: 'Username sudah digunakan' });
      target.username = username.trim();
    }
    if (password) target.password_hash = bcrypt.hashSync(password, 10);
    if (account_name != null) target.account_name = account_name?.trim() || null;
    
    if (company_name !== undefined && req.adminUser.role === 'SUPER_ADMIN') {
      target.company_name = company_name?.trim() || null;
    }

    if (agent_uuids != null) {
      if (req.adminUser.role === 'COMPANY_ADMIN') {
        const allowedAgents = req.adminUser.agent_uuids || [];
        const invalidAgents = agent_uuids.filter(uuid => !allowedAgents.includes(uuid));
        if (invalidAgents.length > 0) {
          return res.status(403).json({ ok: false, error: 'Akses ditolak: Anda tidak memiliki wewenang untuk menetapkan agen tersebut.' });
        }
      }
      target.agent_uuids = agent_uuids;
    }

    if (agent_uuid != null) {
      target.agent_uuid = agent_uuid?.trim() || null;
      if (agent_uuid.trim()) {
        target.site_uuid = await resolveSiteUuidForAgent(agent_uuid, target.site_uuid, req.adminUser, req.body.site_uuid);
      }
    }
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
    
    if (req.adminUser.role === 'COMPANY_ADMIN') {
      if (target.company_name !== req.adminUser.company_name) {
        return res.status(403).json({ ok: false, error: 'Access Denied: Akun ini bukan milik perusahaan Anda.' });
      }
    } else if (req.adminUser.role !== 'SUPER_ADMIN' && target.site_uuid !== req.adminUser.site_uuid) {
      return res.status(403).json({ ok: false, error: 'Unauthorized: This account does not belong to your tenant.' });
    }
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
    
    if (req.adminUser.role === 'COMPANY_ADMIN') {
      if (target.company_name !== req.adminUser.company_name) {
        return res.status(403).json({ ok: false, error: 'Access Denied: Akun ini bukan milik perusahaan Anda.' });
      }
    } else if (req.adminUser.role !== 'SUPER_ADMIN' && target.site_uuid !== req.adminUser.site_uuid) {
      return res.status(403).json({ ok: false, error: 'Unauthorized: This account does not belong to your tenant.' });
    }
    target.profile_picture = req.file.filename;
    await target.save();
    res.json({ ok: true, message: 'Foto profil berhasil diperbarui', filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/auth/admin/create-external-user — buat akun Eksternal (SOC Analyst, Engineer, dll)
router.post('/admin/create-external-user', requireAdmin, blockAnalyst, handleCreateExternalUser);

module.exports = router;
