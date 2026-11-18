/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: routes/index.js
 * Chức năng: Tập trung và Đăng ký toàn bộ API Routers của Hệ thống
 * ============================================================
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const musicalRoutes = require('./musical.routes');
const scheduleRoutes = require('./schedule.routes');
const bookingRoutes = require('./booking.routes');
const voucherRoutes = require('./voucher.routes');
const artistRoutes = require('./artist.routes');
const subscriberRoutes = require('./subscriber.routes');
const adminRoutes = require('./admin.routes');
const opsRoutes = require('./ops.routes');
const adminController = require('../controllers/admin.controller');

// 1. Phân hệ Khách hàng (Customer Portal)
router.use('/auth', authRoutes);
router.use('/musicals', musicalRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/bookings', bookingRoutes);
router.use('/vouchers', voucherRoutes);
router.use('/artists', artistRoutes);
router.use('/subscribers', subscriberRoutes);

// 2. Phân hệ Quản trị (Admin Portal)
router.use('/admin', adminRoutes);

// 3. Phân hệ Soát vé Cửa Rạp (Ops Portal)
router.use('/ops', opsRoutes);

// 4. Endpoint Kiểm tra sức khỏe hệ thống (Health Check)
router.get('/health', adminController.healthCheck);

module.exports = router;
