// backend/routes/auth/settings.js
const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const User = require('../../models/User');
const { requireAuth, makeToken, setCookieToken, upload } = require('./helpers');

const router = express.Router();

// ─── POST /api/auth/change-password ──────────────────────────────────────────
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const user = await User.findById(req.user.id).select('+password_hash');
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(400).json({ error: 'Password saat ini salah' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ error: 'Password baru tidak memenuhi kriteria: minimal 6 karakter, serta mengandung huruf besar, huruf kecil, dan angka.' });
    }

    user.password_hash = bcrypt.hashSync(newPassword, 10);
    await user.save();

    res.json({ ok: true, message: 'Password berhasil diubah!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/auth/change-username ──────────────────────────────────────────
router.post('/change-username', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newUsername } = req.body;
    if (!currentPassword || !newUsername) {
      return res.status(400).json({ error: 'Current password and new username are required' });
    }
    if (newUsername.length < 4 || /[^a-zA-Z0-9_]/.test(newUsername)) {
      return res.status(400).json({ error: 'Username baru tidak valid (minimal 4 karakter, hanya huruf, angka, dan underscore).' });
    }

    const user = await User.findById(req.user.id).select('+password_hash');
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(400).json({ error: 'Password saat ini salah' });
    }

    const existing = await User.findOne({ username: newUsername });
    if (existing) return res.status(400).json({ error: 'Username sudah digunakan oleh akun lain' });

    user.username = newUsername;
    await user.save();

    const newToken = makeToken(user);
    setCookieToken(res, newToken);

    res.json({ ok: true, message: 'Username berhasil diubah!', newUsername });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/auth/change-account-name ──────────────────────────────────────
router.post('/change-account-name', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newAccountName } = req.body;
    if (!currentPassword || newAccountName == null) {
      return res.status(400).json({ error: 'Current password and new account name are required' });
    }
    if (!newAccountName.trim()) {
      return res.status(400).json({ error: 'Nama akun tidak boleh kosong' });
    }

    const user = await User.findById(req.user.id).select('+password_hash');
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(400).json({ error: 'Password saat ini salah' });
    }

    user.account_name = newAccountName.trim();
    await user.save();

    const newToken = makeToken(user);
    setCookieToken(res, newToken);

    res.json({ ok: true, message: 'Nama akun berhasil diubah!', newAccountName: user.account_name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/auth/upload-profile-picture ───────────────────────────────────
router.post('/upload-profile-picture', requireAuth, upload.single('profile_picture'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.profile_picture = req.file.filename;
    await user.save();

    const newToken = makeToken(user);
    setCookieToken(res, newToken);

    res.json({ ok: true, message: 'Foto profil berhasil diperbarui', profile_picture: req.file.filename });
  } catch (err) {
    console.error('[Upload Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/auth/remove-profile-picture ───────────────────────────────────
router.post('/remove-profile-picture', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.profile_picture) {
      const filePath = path.join(__dirname, '..', '..', 'uploads', user.profile_picture);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    user.profile_picture = null;
    await user.save();

    const newToken = makeToken(user);
    setCookieToken(res, newToken);

    res.json({ ok: true, message: 'Foto profil berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
