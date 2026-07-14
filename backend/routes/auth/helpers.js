// backend/routes/auth/helpers.js
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { requireAuth, requireAdmin, JWT_SECRET } = require('../../middleware/auth');

function makeToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      username: user.username,
      account_name: user.account_name,
      profile_picture: user.profile_picture,
      role: user.role,
      site_uuid: user.site_uuid,
      agent_uuid: user.agent_uuid,
    },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
}

function setCookieToken(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
  });
}

function getUploadsDir() {
  if (fs.existsSync('/home/adminbackend/web/demoplace.my.id/public_html')) {
    return '/home/adminbackend/web/demoplace.my.id/public_html/api/uploads';
  } else {
    return path.join(__dirname, '..', '..', 'public', 'api', 'uploads');
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = getUploadsDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

module.exports = {
  JWT_SECRET,
  makeToken,
  setCookieToken,
  requireAuth,
  requireAdmin,
  upload,
  getUploadsDir
};
