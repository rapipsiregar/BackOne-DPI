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
    let query = {};
    if (req.adminUser.role === 'TENANT_ADMIN') {
      query = {
        $or: [
          { role: 'AGENT_VIEWER', site_uuid: req.adminUser.site_uuid },
          { created_by: req.adminUser.username }
        ]
      };
    } else if (req.adminUser.role === 'COMPANY_ADMIN') {
      // COMPANY_ADMIN bisa melihat SEMUA user milik perusahaannya (termasuk dirinya sendiri)
      query = {
        company_name: req.adminUser.company_name
      };
      // Tidak exclude diri sendiri — COMPANY_ADMIN perlu melihat dirinya agar company card muncul
      const users = await User.find(query, '-password_hash').sort({ created_at: 1 });
      const data = users.map(u => ({
        id: u._id.toString(),
        username: u.username,
        account_name: u.account_name,
        profile_picture: u.profile_picture,
        role: u.role,
        site_uuid: u.site_uuid,
        agent_uuid: u.agent_uuid,
        company_name: u.company_name,
        agent_uuids: u.agent_uuids || [],
        is_active: u.is_active,
        login_attempts: u.login_attempts || 0,
        lockout_until: u.lockout_until || null,
      }));
      return res.json({ ok: true, data });
    }
    query.username = { $ne: req.adminUser.username };
    const users = await User.find(query, '-password_hash').sort({ created_at: 1 });
    const data = users.map(u => ({
      id: u._id.toString(),
      username: u.username,
      account_name: u.account_name,
      profile_picture: u.profile_picture,
      role: u.role,
      site_uuid: u.site_uuid,
      agent_uuid: u.agent_uuid,
      company_name: u.company_name,
      agent_uuids: u.agent_uuids || [],
      is_active: u.is_active,
      login_attempts: u.login_attempts || 0,
      lockout_until: u.lockout_until || null,
    }));
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/auth/admin/unlock-user — unlock akun yang terkunci
router.post('/admin/unlock-user', requireAdmin, blockAnalyst, async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ ok: false, error: 'user_id wajib diisi' });
    }

    const target = await User.findById(user_id);
    if (!target) {
      return res.status(404).json({ ok: false, error: 'User tidak ditemukan' });
    }
    
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

    let siteUuid = null;
    if (agent_uuid) {
      const { Summary } = require('../../models/Schemas');
      const summaryDoc = await Summary.findOne({ agent_uuid: agent_uuid.trim() });
      if (summaryDoc) {
        siteUuid = summaryDoc.site_uuid;
      }
    }

    if (!siteUuid) {
      siteUuid = req.adminUser.role === 'SUPER_ADMIN'
        ? (req.body.site_uuid || process.env.BACKONE_SITE_UUID || process.env.NETIFY_SITE_UUID || null)
        : req.adminUser.site_uuid;
    }

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
router.post('/admin/update-agent-user', requireAdmin, blockAnalyst, upload.single('profile_picture'), async (req, res) => {
  try {
    const { user_id, username, password, account_name, agent_uuid, company_name } = req.body;
    let agent_uuids = null;
    if (req.body.agent_uuids) {
      try {
        agent_uuids = typeof req.body.agent_uuids === 'string' 
          ? JSON.parse(req.body.agent_uuids) 
          : req.body.agent_uuids;
      } catch {
        agent_uuids = [req.body.agent_uuids];
      }
    }

    if (!user_id) return res.status(400).json({ ok: false, error: 'user_id wajib diisi' });

    const target = await User.findById(user_id).select('+password_hash');
    if (!target) return res.status(404).json({ ok: false, error: 'User tidak ditemukan' });
    if (target.role === 'SUPER_ADMIN') return res.status(403).json({ ok: false, error: 'Tidak bisa mengubah akun SUPER_ADMIN dari sini' });
    
    // Validasi otorisasi kepemilikan tenant/perusahaan
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
    
    // Perbarui company_name (hanya untuk SUPER_ADMIN)
    if (company_name !== undefined && req.adminUser.role === 'SUPER_ADMIN') {
      target.company_name = company_name?.trim() || null;
    }

    // Perbarui penugasan multi-agent
    if (agent_uuids != null) {
      // Validasi delegasi jika dilakukan oleh COMPANY_ADMIN
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
        const { Summary } = require('../../models/Schemas');
        const summaryDoc = await Summary.findOne({ agent_uuid: agent_uuid.trim() });
        if (summaryDoc) {
          target.site_uuid = summaryDoc.site_uuid;
        }
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
    
    // Validasi otorisasi penghapusan berdasarkan tenant / company
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
    
    // Validasi otorisasi upload berdasarkan tenant / company
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
router.post('/admin/create-external-user', requireAdmin, blockAnalyst, upload.single('profile_picture'), async (req, res) => {
  try {
    const { username, password, account_name, role, company_name } = req.body;
    let agent_uuids = [];
    if (req.body.agent_uuids) {
      try {
        agent_uuids = typeof req.body.agent_uuids === 'string' 
          ? JSON.parse(req.body.agent_uuids) 
          : req.body.agent_uuids;
      } catch {
        agent_uuids = [req.body.agent_uuids];
      }
    }

    if (!username || !password || !role) {
      return res.status(400).json({ ok: false, error: 'Username, password, dan role wajib diisi' });
    }
    
    // Validasi role yang diizinkan berdasarkan role pencipta
    let validRoles = [];
    if (req.adminUser.role === 'SUPER_ADMIN') {
      validRoles = ['EXECUTIVE', 'SOC_ANALYST', 'ENGINEER', 'TENANT_ADMIN', 'COMPANY_ADMIN', 'COMPANY_OPERATOR', 'COMPANY_VIEWER'];
    } else if (req.adminUser.role === 'COMPANY_ADMIN') {
      validRoles = ['COMPANY_OPERATOR', 'COMPANY_VIEWER'];
    } else {
      validRoles = ['SOC_ANALYST', 'ENGINEER', 'TENANT_ADMIN'];
    }

    if (!validRoles.includes(role)) {
      return res.status(400).json({ ok: false, error: 'Role tidak valid untuk pembuatan akun eksternal' });
    }

    // Tentukan company_name secara otomatis jika dibuat oleh COMPANY_ADMIN
    const targetCompanyName = req.adminUser.role === 'COMPANY_ADMIN' 
      ? req.adminUser.company_name 
      : (company_name?.trim() || null);

    // Validasi: Batas Maksimum 5 Akun per Perusahaan
    if (targetCompanyName) {
      const existingCount = await User.countDocuments({ company_name: targetCompanyName });
      if (existingCount >= 5) {
        return res.status(400).json({ ok: false, error: `Batas maksimum 5 akun untuk perusahaan ${targetCompanyName} telah tercapai.` });
      }
    }

    // Validasi Delegasi Agen (hanya untuk bawahan COMPANY_ADMIN)
    if (req.adminUser.role === 'COMPANY_ADMIN') {
      const allowedAgents = req.adminUser.agent_uuids || [];
      const invalidAgents = agent_uuids.filter(uuid => !allowedAgents.includes(uuid));
      if (invalidAgents.length > 0) {
        return res.status(403).json({ ok: false, error: 'Akses ditolak: Anda tidak memiliki wewenang untuk menetapkan agen tersebut.' });
      }
    }

    const existing = await User.findOne({ username: username.trim() });
    if (existing) {
      return res.status(400).json({ ok: false, error: 'Username sudah digunakan' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    // EXECUTIVE/COMPANY_ADMIN is a global role — always site_uuid = null (not tied to any tenant)
    const siteUuid = (role === 'EXECUTIVE' || role === 'COMPANY_ADMIN')
      ? null
      : req.adminUser.role === 'SUPER_ADMIN'
        ? (req.body.site_uuid || process.env.BACKONE_SITE_UUID || process.env.NETIFY_SITE_UUID || null)
        : req.adminUser.site_uuid;

    const createdBy = req.adminUser.role === 'SUPER_ADMIN'
      ? (req.body.created_by || req.adminUser.username)
      : req.adminUser.username;

    const newUser = await User.create({
      username: username.trim(),
      password_hash: passwordHash,
      account_name: account_name?.trim() || null,
      role: role,
      site_uuid: siteUuid,
      company_name: targetCompanyName,
      agent_uuids: agent_uuids,
      created_by: createdBy,
      profile_picture: req.file ? req.file.filename : null
    });

    res.json({ ok: true, message: 'Akun eksternal berhasil dibuat', userId: newUser._id.toString() });
  } catch (err) {
    const msg = err.code === 11000 ? 'Username sudah digunakan' : err.message;
    res.status(400).json({ ok: false, error: msg });
  }
});

module.exports = router;
