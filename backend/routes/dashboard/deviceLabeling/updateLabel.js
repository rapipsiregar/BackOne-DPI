const { CustomDeviceLabel, DeviceStat } = require('../../../models/Schemas');

async function updateLabelHandler(req, res) {
  try {
    // EXECUTIVE role is read-only — explicitly blocked from writing labels
    if (req.user?.role === 'EXECUTIVE') {
      return res.status(403).json({ ok: false, error: 'Executive role cannot modify device labels.' });
    }

    const isAuthorized = req.user?.role === 'SUPER_ADMIN' ||
      req.user?.role === 'TENANT_ADMIN' ||
      req.user?.role === 'COMPANY_ADMIN' ||
      req.user?.role === 'COMPANY_OPERATOR' ||
      req.user?._originalRole === 'SUPER_ADMIN' ||
      req.user?._originalRole === 'TENANT_ADMIN';

    if (!isAuthorized) {
      return res.status(403).json({ ok: false, error: 'Only administrators can update device labels.' });
    }

    const { mac_address, device_label } = req.body;
    if (!mac_address) return res.status(400).json({ ok: false, error: 'mac_address required' });
    if (device_label === undefined) return res.status(400).json({ ok: false, error: 'device_label required' });

    const isGlobalUser = req.user?.role === 'SUPER_ADMIN' ||
      ((!req.user?.site_uuid || req.user?.site_uuid === 'default') && ['SOC_ANALYST', 'ENGINEER'].includes(req.user?.role)) ||
      req.user?._originalRole === 'SUPER_ADMIN';

    if (!isGlobalUser && req.user?.site_uuid) {
      const deviceExists = await DeviceStat.findOne({
        mac_address,
        site_uuid: req.user.site_uuid
      });
      if (!deviceExists) {
        return res.status(403).json({ ok: false, error: 'Unauthorized: This device does not belong to your tenant.' });
      }
    }

    await CustomDeviceLabel.findOneAndUpdate(
      { mac_address },
      { device_label },
      { upsert: true, new: true }
    );

    res.json({ ok: true, message: 'Device label updated successfully' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

module.exports = updateLabelHandler;
