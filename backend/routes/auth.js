const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getUserByUsername, updateUserPassword, updateUserUsername, updateUserAccountName, updateUserProfilePicture, getDB } = require('../database');
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
    res.json({ user: decoded });
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

module.exports = router;
