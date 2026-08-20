// backend/routes/auth/usersCreateExternal.js
const bcrypt = require('bcryptjs');
const User = require('../../models/User');

async function handleCreateExternalUser(req, res) {
  try {
    const { username, password, account_name, role, company_name } = req.body;
    let agent_uuids = [];
    if (req.body.agent_uuids) {
      agent_uuids = Array.isArray(req.body.agent_uuids)
        ? req.body.agent_uuids
        : (() => { try { return JSON.parse(req.body.agent_uuids); } catch { return [req.body.agent_uuids]; } })();
    }

    if (!username || !password || !role) {
      return res.status(400).json({ ok: false, error: 'Username, password, dan role wajib diisi' });
    }
    
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

    const targetCompanyName = req.adminUser.role === 'COMPANY_ADMIN' 
      ? req.adminUser.company_name 
      : (company_name?.trim() || null);

    if (targetCompanyName) {
      const existingCount = await User.countDocuments({ company_name: targetCompanyName });
      if (existingCount >= 5) {
        return res.status(400).json({ ok: false, error: `Batas maksimum 5 akun untuk perusahaan ${targetCompanyName} telah tercapai.` });
      }
    }

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
    const siteUuid = (role === 'EXECUTIVE' || role === 'COMPANY_ADMIN')
      ? null
      : req.adminUser.role === 'SUPER_ADMIN'
        ? (req.body.site_uuid || process.env.BACKONE_SITE_UUID || null)
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
      profile_picture: null
    });

    res.json({ ok: true, message: 'Akun eksternal berhasil dibuat', userId: newUser._id.toString() });
  } catch (err) {
    const msg = err.code === 11000 ? 'Username sudah digunakan' : err.message;
    res.status(400).json({ ok: false, error: msg });
  }
}

module.exports = { handleCreateExternalUser };
