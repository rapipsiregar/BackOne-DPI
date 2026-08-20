// backend/routes/auth/usersHelper.js
// ─────────────────────────────────────────────────────────────────────────────
// User management helper logic & site UUID resolver (BackOne API compliant)
// ─────────────────────────────────────────────────────────────────────────────

const { Summary } = require('../../models/Schemas');

function blockAnalyst(req, res, next) {
  if (req.adminUser.role === 'SOC_ANALYST') {
    return res.status(403).json({ ok: false, error: 'Aksi ini tidak diizinkan untuk peran SOC Analyst' });
  }
  next();
}

async function resolveSiteUuidForAgent(agentUuid, fallbackSiteUuid, adminUser, bodySiteUuid) {
  let siteUuid = null;
  if (agentUuid) {
    const summaryDoc = await Summary.findOne({ agent_uuid: agentUuid.trim() });
    if (summaryDoc) {
      siteUuid = summaryDoc.site_uuid;
    }
  }

  if (!siteUuid) {
    siteUuid = adminUser.role === 'SUPER_ADMIN'
      ? (bodySiteUuid || process.env.BACKONE_SITE_UUID || fallbackSiteUuid || null)
      : adminUser.site_uuid;
  }

  return siteUuid;
}

function mapUserData(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    account_name: user.account_name,
    profile_picture: user.profile_picture,
    role: user.role,
    site_uuid: user.site_uuid,
    agent_uuid: user.agent_uuid,
    company_name: user.company_name,
    agent_uuids: user.agent_uuids || [],
    is_active: user.is_active,
    login_attempts: user.login_attempts || 0,
    lockout_until: user.lockout_until || null,
  };
}

module.exports = {
  blockAnalyst,
  resolveSiteUuidForAgent,
  mapUserData,
};
