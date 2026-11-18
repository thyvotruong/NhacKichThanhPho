/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: routes/ops.routes.js
 * ============================================================
 */

const express = require('express');
const router = express.Router();
const opsController = require('../controllers/ops.controller');

router.post('/check-in', opsController.checkInTicket);
router.get('/dashboard', opsController.getOpsDashboard);
router.get('/lookup', opsController.lookupTicket);

module.exports = router;
