const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const { Summary } = require('../models/Schemas');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-backone-key';

async function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);

    // Verify session status in MongoDB
    if (req.user.session_id) {
      const activeSession = await Session.findById(req.user.session_id);
      if (!activeSession) {
        res.clearCookie('token');
        return res.status(401).json({ error: 'Sesi login telah dinonaktifkan atau kedaluwarsa.' });
      }
      // Update last active
      activeSession.last_active = new Date();
      await activeSession.save();
    }

    // ── VIEW-AS MODE ──────────────────────────────────────────────────────────
    const viewAsHeader = req.headers['x-view-as-agent'];
    const isAllowedViewAs = req.user.role === 'SUPER_ADMIN' || 
      req.user.role === 'TENANT_ADMIN' || 
      req.user.role === 'COMPANY_ADMIN' || 
      req.user.role === 'COMPANY_OPERATOR';

    if (viewAsHeader && isAllowedViewAs) {
      try {
        const viewDecoded = jwt.verify(viewAsHeader, JWT_SECRET);
        if (viewDecoded.type === 'view-as' && viewDecoded.adminId === req.user.id && viewDecoded.viewAs) {
          const targetAgent = viewDecoded.viewAs;

          // Validation: COMPANY_ADMIN and COMPANY_OPERATOR can only view-as their assigned agents
          if (['COMPANY_ADMIN', 'COMPANY_OPERATOR'].includes(req.user.role)) {
            const hasAccess = req.user.agent_uuids && req.user.agent_uuids.includes(targetAgent);
            if (!hasAccess) {
              throw new Error('Unauthorized view-as agent access');
            }
          }

          const targetAgentUser = await User.findOne({ agent_uuid: targetAgent, role: 'AGENT_VIEWER' }).lean();
          
          let targetSiteUuid = req.user.site_uuid;
          if (targetAgentUser && targetAgentUser.site_uuid) {
            targetSiteUuid = targetAgentUser.site_uuid;
          } else {
            const summaryDoc = await Summary.findOne({ agent_uuid: targetAgent }).lean();
            if (summaryDoc && summaryDoc.site_uuid) {
              targetSiteUuid = summaryDoc.site_uuid;
            }
          }

          req.user = {
            ...req.user,
            role:          'AGENT_VIEWER',
            agent_uuid:    targetAgent,
            agent_label:   viewDecoded.viewAsLabel,
            site_uuid:     targetSiteUuid,
            _viewAsMode:   true,
            _originalRole: req.user.role,
          };
        }
      } catch (viewErr) {
        console.warn('[ViewAs] Invalid view-as token, ignoring:', viewErr.message);
      }
    }

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

async function requireAdmin(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify session status in MongoDB
    if (decoded.session_id) {
      const activeSession = await Session.findById(decoded.session_id);
      if (!activeSession) {
        res.clearCookie('token');
        return res.status(401).json({ error: 'Sesi login telah dinonaktifkan atau kedaluwarsa.' });
      }
      activeSession.last_active = new Date();
      await activeSession.save();
    }

    const validAdminRoles = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'COMPANY_OPERATOR', 'TENANT_ADMIN', 'SOC_ANALYST'];
    if (!validAdminRoles.includes(decoded.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.adminUser = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token tidak valid' });
  }
}

module.exports = {
  requireAuth,
  requireAdmin,
  JWT_SECRET
};
