// backend/routes/auth.js
// ─────────────────────────────────────────────────────────────────────────────
// BackOne Authentication Routes Orchestrator
// Splits monolithic authentication routes into modular sub-routers.
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();

const coreRoutes = require('./auth/core');
const settingsRoutes = require('./auth/settings');
const usersRoutes = require('./auth/users');
const viewAsRoutes = require('./auth/viewAs');

router.use('/', coreRoutes);
router.use('/', settingsRoutes);
router.use('/', usersRoutes);
router.use('/', viewAsRoutes);

module.exports = router;
