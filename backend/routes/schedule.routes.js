/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: routes/schedule.routes.js
 * ============================================================
 */

const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');
const seatController = require('../controllers/seat.controller');

router.get('/', scheduleController.getSchedules);
router.get('/:scheduleId/seats', seatController.getSeats);
router.post('/:scheduleId/hold-seats', seatController.holdSeats);
router.post('/:scheduleId/release-seats', seatController.releaseSeats);

module.exports = router;
