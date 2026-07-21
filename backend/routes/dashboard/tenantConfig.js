const express = require('express');
const router  = express.Router();
const { TenantConfig } = require('../../models/Schemas');

router.get('/tenant-config', async (req, res) => {
  try {
    let siteUuid = 'default';

    // If Super Admin has a selected site (passed in x-backone-site-uuid header),
    // we want them to see the branding of that selected site.
    // Otherwise they see BackOne (default) branding.
    const isGlobalUser = req.user?.role === 'SUPER_ADMIN' ||
      ((!req.user?.site_uuid || req.user?.site_uuid === 'default') && ['SOC_ANALYST', 'ENGINEER'].includes(req.user?.role));

    if (isGlobalUser) {
      const requestedSiteUuid = req.headers['x-backone-site-uuid'];
      if (requestedSiteUuid) {
        siteUuid = requestedSiteUuid;
      }
    } else if (req.user?.site_uuid) {
      // For TENANT_ADMIN or other isolated roles, they only see their own site branding
      siteUuid = req.user.site_uuid;
    }

    let config = await TenantConfig.findOne({ site_uuid: siteUuid });
    if (!config) {
      // Fallback to default branding if config is not found
      config = await TenantConfig.findOne({ site_uuid: 'default' });
    }

    res.json({ ok: true, data: config });
  } catch (err) {
    console.error('[/tenant-config]', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
