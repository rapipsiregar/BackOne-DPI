// backend/routes/dashboard/deviceLabeling.js
// ─────────────────────────────────────────────────────────────────────────────
// BackOne Device Labeling Sub-router (Modular Version for Rule 3 Compliance)
// Tanggung jawab: Mengatur otorisasi dan mendaftarkan route untuk labeling.
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();

const updateLabelHandler = require('./deviceLabeling/updateLabel');
const getLabelingHandler = require('./deviceLabeling/getLabeling');
const getMacDetailsHandler = require('./deviceLabeling/getMacDetails');

// POST /api/dashboard/devices/update-label
router.post('/devices/update-label', updateLabelHandler);

// GET /api/dashboard/devices/labeling
router.get('/devices/labeling', getLabelingHandler);

// GET /api/dashboard/devices/mac-details
router.get('/devices/mac-details', getMacDetailsHandler);

module.exports = router;
