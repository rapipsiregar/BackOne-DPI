const express = require('express');
const router  = express.Router();
const { BlacklistRule } = require('../../models/Schemas');
const { getBaseFilter } = require('./helpers');

// GET /api/dashboard/blacklist
router.get('/blacklist', async (req, res) => {
  try {
    const filter = getBaseFilter(req);
    const site_uuid = filter.site_uuid;
    if (!site_uuid) {
      return res.status(400).json({ error: 'Site UUID is required' });
    }

    const query = { site_uuid };
    if (filter.agent_uuid) {
      query.agent_uuid = filter.agent_uuid;
    }

    const rules = await BlacklistRule.find(query).sort({ created_at: -1 }).lean();
    return res.json({ ok: true, data: rules });
  } catch (err) {
    console.error('[Blacklist GET] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/dashboard/blacklist
router.post('/blacklist', async (req, res) => {
  try {
    if (req.user?.role !== 'AGENT_VIEWER') {
      return res.status(403).json({ error: 'Only Network Agents (or Admins in View As mode) can modify blacklist rules.' });
    }
    const filter = getBaseFilter(req);
    const site_uuid = filter.site_uuid;
    const agent_uuid = filter.agent_uuid;
    if (!site_uuid) {
      return res.status(400).json({ error: 'Site UUID is required' });
    }
    if (!agent_uuid) {
      return res.status(400).json({ error: 'Agent UUID is required' });
    }

    const { type, value } = req.body;
    if (!type || !value) {
      return res.status(400).json({ error: 'Type and value are required' });
    }

    if (!['category', 'domain'].includes(type)) {
      return res.status(400).json({ error: 'Invalid blacklist type' });
    }

    // Upsert or create rule isolated per agent
    const rule = await BlacklistRule.findOneAndUpdate(
      { site_uuid, agent_uuid, type, value: value.trim() },
      { site_uuid, agent_uuid, type, value: value.trim(), is_active: true },
      { upsert: true, new: true }
    );

    return res.json({ ok: true, data: rule });
  } catch (err) {
    console.error('[Blacklist POST] Error:', err.message);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Rule already exists' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/dashboard/blacklist/:id
router.delete('/blacklist/:id', async (req, res) => {
  try {
    if (req.user?.role !== 'AGENT_VIEWER') {
      return res.status(403).json({ error: 'Only Network Agents (or Admins in View As mode) can modify blacklist rules.' });
    }
    const filter = getBaseFilter(req);
    const site_uuid = filter.site_uuid;
    const agent_uuid = filter.agent_uuid;
    if (!site_uuid) {
      return res.status(400).json({ error: 'Site UUID is required' });
    }
    if (!agent_uuid) {
      return res.status(400).json({ error: 'Agent UUID is required' });
    }

    const ruleId = req.params.id;
    const result = await BlacklistRule.deleteOne({ _id: ruleId, site_uuid, agent_uuid });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Blacklist rule not found' });
    }

    return res.json({ ok: true, message: 'Blacklist rule deleted' });
  } catch (err) {
    console.error('[Blacklist DELETE] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
