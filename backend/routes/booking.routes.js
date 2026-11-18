/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: routes/booking.routes.js
 * ============================================================
 */

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');

router.post('/', bookingController.createBooking);
router.get('/my-bookings', bookingController.getMyBookings);
router.post('/:bookingCode/cancel', bookingController.cancelBooking);

module.exports = router;
