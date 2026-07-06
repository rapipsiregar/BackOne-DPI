const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getUserByUsername, getUserByAgentUuid, updateUserPassword, updateUserUsername, updateUserAccountName, updateUserProfilePicture, getAllUsers, getUserById, createAgentUser, adminUpdateUser, deleteAgentUser, getDB } = require('../database');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-backone-key';

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = getUserByUsername(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, account_name: user.account_name, profile_picture: user.profile_picture, role: user.role, site_uuid: user.site_uuid, agent_uuid: user.agent_uuid },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  // Set HttpOnly cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });

  res.json({
    message: 'Login successful',
    user: { id: user.id, username: user.username, account_name: user.account_name, profile_picture: user.profile_picture, role: user.role, site_uuid: user.site_uuid, agent_uuid: user.agent_uuid }
  });
});

router.get('/me', (req, res) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Query DB fresh for latest account_name/profile_picture (in case admin updated after login)
    const freshUser = getUserByUsername(decoded.username);
    if (!freshUser) {
      // Fallback to JWT data if user not found (edge case)
      return res.json({ user: decoded });
    }

    // For AGENT_VIEWER: also check if there's a canonical account for the same agent_uuid
    // that has account_name set (handles duplicate account edge case)
    let accountName = freshUser.account_name;
    if (!accountName && freshUser.agent_uuid && freshUser.role === 'AGENT_VIEWER') {
      const canonicalUser = getUserByAgentUuid(freshUser.agent_uuid);
      if (canonicalUser?.account_name) {
        accountName = canonicalUser.account_name;
      }
    }

    res.json({
      user: {
        id: freshUser.id,
        username: freshUser.username,
        account_name: accountName || freshUser.account_name,
        profile_picture: freshUser.profile_picture,
        role: freshUser.role,
        site_uuid: freshUser.site_uuid,
        agent_uuid: freshUser.agent_uuid,
        // Keep iat/exp from JWT for session validity
        iat: decoded.iat,
        exp: decoded.exp,
      }
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/change-password', (req, res) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // 1. Get user details from database
    const user = getUserByUsername(decoded.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Verify current password
    const isCurrentValid = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isCurrentValid) {
      return res.status(400).json({ error: 'Password saat ini salah' });
    }

    // 3. Validate new password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        error: 'Password baru tidak memenuhi kriteria: minimal 6 karakter, serta mengandung huruf besar, huruf kecil, dan angka.'
      });
    }

    // 4. Hash new password and save to DB
    const newHash = bcrypt.hashSync(newPassword, 10);
    updateUserPassword(user.id, newHash);

    return res.json({ ok: true, message: 'Password berhasil diubah!' });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/change-username', (req, res) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { currentPassword, newUsername } = req.body;

    if (!currentPassword || !newUsername) {
      return res.status(400).json({ error: 'Current password and new username are required' });
    }

    if (newUsername.length < 4 || /[^a-zA-Z0-9_]/.test(newUsername)) {
      return res.status(400).json({ error: 'Username baru tidak valid (minimal 4 karakter, hanya huruf, angka, dan underscore).' });
    }

    // 1. Get user details from database
    const user = getUserByUsername(decoded.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Verify current password
    const isCurrentValid = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isCurrentValid) {
      return res.status(400).json({ error: 'Password saat ini salah' });
    }

    // 3. Check if new username is already taken
    const existingUser = getUserByUsername(newUsername);
    if (existingUser) {
      return res.status(400).json({ error: 'Username sudah digunakan oleh akun lain' });
    }

    // 4. Update username in DB
    updateUserUsername(user.id, newUsername);

    // 5. Generate new token with updated username
    const newToken = jwt.sign(
      { id: user.id, username: newUsername, account_name: user.account_name, profile_picture: user.profile_picture, role: user.role, site_uuid: user.site_uuid, agent_uuid: user.agent_uuid },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Set new HttpOnly cookie
    res.cookie('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    return res.json({ ok: true, message: 'Username berhasil diubah!', newUsername });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/change-account-name', (req, res) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { currentPassword, newAccountName } = req.body;

    if (!currentPassword || newAccountName === undefined || newAccountName === null) {
      return res.status(400).json({ error: 'Current password and new account name are required' });
    }

    if (newAccountName.trim().length === 0) {
      return res.status(400).json({ error: 'Nama akun tidak boleh kosong' });
    }

    // 1. Get user details from database
    const user = getUserByUsername(decoded.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Verify current password
    const isCurrentValid = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isCurrentValid) {
      return res.status(400).json({ error: 'Password saat ini salah' });
    }

    // 3. Update account name in DB
    updateUserAccountName(user.id, newAccountName.trim());

    // 4. Generate new token with updated account name
    const newToken = jwt.sign(
      { id: user.id, username: user.username, account_name: newAccountName.trim(), profile_picture: user.profile_picture, role: user.role, site_uuid: user.site_uuid, agent_uuid: user.agent_uuid },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Set new HttpOnly cookie
    res.cookie('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    return res.json({ ok: true, message: 'Nama akun berhasil diubah!', newAccountName: newAccountName.trim() });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/upload-profile-picture', upload.single('profile_picture'), (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const user = getUserByUsername(decoded.username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    updateUserProfilePicture(user.id, req.file.filename);

    const newToken = jwt.sign(
      { id: user.id, username: user.username, account_name: user.account_name, profile_picture: req.file.filename, role: user.role, site_uuid: user.site_uuid, agent_uuid: user.agent_uuid },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ ok: true, message: 'Foto profil berhasil diperbarui', profile_picture: req.file.filename });
  } catch (err) {
    console.error('[Upload Error]', err);
    res.status(401).json({ error: 'Invalid token', details: err.message });
  }
});

router.post('/remove-profile-picture', (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = getUserByUsername(decoded.username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.profile_picture) {
      const filePath = path.join(__dirname, '..', 'uploads', user.profile_picture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    updateUserProfilePicture(user.id, null);

    const newToken = jwt.sign(
      { id: user.id, username: user.username, account_name: user.account_name, profile_picture: null, role: user.role, site_uuid: user.site_uuid, agent_uuid: user.agent_uuid },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ ok: true, message: 'Foto profil berhasil dihapus' });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

router.get('/geoip', async (req, res) => {
  const ip = req.query.ip;
  if (!ip) {
    return res.status(400).json({ error: 'IP is required' });
  }
  
  const d = getDB();
  try {
    // 1. Check local cache
    let cached = d.prepare("SELECT * FROM geoip_cache WHERE ip_address = ?").get(ip);
    if (cached) {
      return res.json(cached);
    }
    
    // 2. Check if private IP (IPv4 and IPv6 link local)
    const parts = ip.split('.');
    let isPrivate = false;
    if (parts.length === 4) {
      const o1 = parseInt(parts[0], 10);
      const o2 = parseInt(parts[1], 10);
      if (o1 === 10) isPrivate = true;
      else if (o1 === 192 && o2 === 168) isPrivate = true;
      else if (o1 === 172 && (o2 >= 16 && o2 <= 31)) isPrivate = true;
      else if (o1 === 127) isPrivate = true;
      else if (o1 === 169 && o2 === 254) isPrivate = true;
    } else if (ip.startsWith('fe80:') || ip === '::1' || ip.startsWith('fd')) {
      isPrivate = true;
    }
    
    if (isPrivate) {
      const privateInfo = {
        ip_address: ip,
        isp: 'Intranet / Private Network',
        country: 'Local',
        city: 'Local',
        as_org: 'RFC 1918 Private Range'
      };
      d.prepare("INSERT OR IGNORE INTO geoip_cache (ip_address, isp, country, city, as_org) VALUES (?, ?, ?, ?, ?)").run(
        privateInfo.ip_address, privateInfo.isp, privateInfo.country, privateInfo.city, privateInfo.as_org
      );
      return res.json(privateInfo);
    }
    
    // 3. Query public GeoIP API (ip-api.com) with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second timeout
    
    const response = await fetch(`http://ip-api.com/json/${ip}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    const geo = await response.json();
    if (geo && geo.status === 'success') {
      const publicInfo = {
        ip_address: ip,
        isp: geo.isp || 'Unknown ISP',
        country: geo.country || 'Unknown Country',
        city: geo.city || 'Unknown City',
        as_org: geo.as || geo.org || 'Data Center'
      };
      
      d.prepare("INSERT OR IGNORE INTO geoip_cache (ip_address, isp, country, city, as_org) VALUES (?, ?, ?, ?, ?)").run(
        publicInfo.ip_address, publicInfo.isp, publicInfo.country, publicInfo.city, publicInfo.as_org
      );
      return res.json(publicInfo);
    } else {
      // Return temporary/fallback details for lookup failures without caching
      return res.json({
        ip_address: ip,
        isp: 'Public IP',
        country: 'Remote',
        city: 'Remote',
        as_org: 'Public Network'
      });
    }
  } catch (err) {
    return res.json({
      ip_address: ip,
      isp: 'Public IP',
      country: 'Remote',
      city: 'Remote',
      as_org: 'Public Network'
    });
  }
});

// ─── ADMIN: USER MANAGEMENT ─────────────────────────────────────────────────

// Middleware: hanya SUPER_ADMIN yang boleh akses
function requireAdmin(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Hanya admin yang boleh akses' });
    req.adminUser = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token tidak valid' });
  }
}

// Middleware: auth untuk semua user terlogin
function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token tidak valid' });
  }
}

// GET /api/auth/admin/users — daftar semua users (hanya admin)
router.get('/admin/users', requireAdmin, (req, res) => {
  try {
    const users = getAllUsers();
    res.json({ ok: true, data: users });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/auth/admin/create-agent-user — buat akun Network Agent baru
router.post('/admin/create-agent-user', requireAdmin, (req, res) => {
  const { username, password, account_name, agent_uuid } = req.body;
  if (!username || !password) {
    return res.status(400).json({ ok: false, error: 'Username dan password wajib diisi' });
  }
  try {
    const passwordHash = bcrypt.hashSync(password, 10);
    const siteUuid = process.env.BACKONE_SITE_UUID || process.env.NETIFY_SITE_UUID || null;
    const result = createAgentUser(username.trim(), passwordHash, account_name?.trim() || null, agent_uuid?.trim() || null, siteUuid);
    res.json({ ok: true, message: 'Akun Network Agent berhasil dibuat', userId: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// POST /api/auth/admin/update-agent-user — update akun Network Agent
router.post('/admin/update-agent-user', requireAdmin, upload.single('profile_picture'), async (req, res) => {
  const { user_id, username, password, account_name, agent_uuid } = req.body;
  if (!user_id) return res.status(400).json({ ok: false, error: 'user_id wajib diisi' });

  try {
    const target = getUserById(parseInt(user_id));
    if (!target) return res.status(404).json({ ok: false, error: 'User tidak ditemukan' });
    if (target.role === 'SUPER_ADMIN') return res.status(403).json({ ok: false, error: 'Tidak bisa mengubah akun SUPER_ADMIN dari sini' });

    const fields = {};
    if (username?.trim()) {
      // Cek username unik
      const existing = getAllUsers().find(u => u.username === username.trim() && u.id !== parseInt(user_id));
      if (existing) return res.status(400).json({ ok: false, error: 'Username sudah digunakan' });
      fields.username = username.trim();
    }
    if (password) fields.password_hash = bcrypt.hashSync(password, 10);
    if (account_name !== undefined) fields.account_name = account_name?.trim() || null;
    if (agent_uuid !== undefined) fields.agent_uuid = agent_uuid?.trim() || null;
    if (req.file) fields.profile_picture = req.file.filename;

    adminUpdateUser(parseInt(user_id), fields);
    const updated = getUserById(parseInt(user_id));
    res.json({ ok: true, message: 'Akun berhasil diperbarui', user: updated });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/auth/admin/delete-agent-user/:id — hapus akun Network Agent
router.delete('/admin/delete-agent-user/:id', requireAdmin, (req, res) => {
  try {
    deleteAgentUser(parseInt(req.params.id));
    res.json({ ok: true, message: 'Akun berhasil dihapus' });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// POST /api/auth/admin/upload-agent-picture/:id — upload foto profil untuk agent oleh admin
router.post('/admin/upload-agent-picture/:id', requireAdmin, upload.single('profile_picture'), (req, res) => {
  const userId = parseInt(req.params.id);
  if (!req.file) return res.status(400).json({ ok: false, error: 'File gambar wajib diupload' });
  try {
    const target = getUserById(userId);
    if (!target) return res.status(404).json({ ok: false, error: 'User tidak ditemukan' });
    adminUpdateUser(userId, { profile_picture: req.file.filename });
    res.json({ ok: true, message: 'Foto profil berhasil diperbarui', filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── ADMIN: VIEW-AS AGENT ────────────────────────────────────────────────────

// POST /api/auth/admin/view-as — admin masuk mode "lihat sebagai agent"
router.post('/admin/view-as', requireAdmin, (req, res) => {
  const { agent_uuid, agent_label } = req.body;
  if (!agent_uuid) return res.status(400).json({ ok: false, error: 'agent_uuid wajib diisi' });

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

  // Return token dalam JSON body (frontend akan simpan di localStorage)
  // Pendekatan ini lebih reliable daripada Set-Cookie melalui proxy
  res.json({ 
    ok: true, 
    message: `Sekarang melihat sebagai ${agent_label || agent_uuid}`,
    view_token: viewToken,
    agent_uuid,
    agent_label: agent_label || agent_uuid
  });
});

// DELETE /api/auth/admin/view-as — keluar dari mode view-as
router.delete('/admin/view-as', requireAdmin, (req, res) => {
  res.clearCookie('view_as_token');
  res.json({ ok: true, message: 'Kembali ke tampilan admin' });
});

// GET /api/auth/view-as — cek status view-as (untuk frontend)
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
