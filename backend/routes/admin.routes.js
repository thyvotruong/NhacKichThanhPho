/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: routes/admin.routes.js
 * ============================================================
 */

const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const musicalController = require('../controllers/musical.controller');
const artistController = require('../controllers/artist.controller');
const scheduleController = require('../controllers/schedule.controller');
const seatController = require('../controllers/seat.controller');
const bookingController = require('../controllers/booking.controller');
const voucherController = require('../controllers/voucher.controller');
const authController = require('../controllers/auth.controller');
const subscriberController = require('../controllers/subscriber.controller');
const auditLogController = require('../controllers/audit-log.controller');

// 1. Dashboard & Reports
router.get('/dashboard', adminController.getDashboardStats);
router.get('/reports/revenue', adminController.getRevenueReport);
router.get('/reports/reconciliation', adminController.getReconciliationReport);

// 2. Musicals
router.get('/musicals', musicalController.getAdminMusicals);
router.post('/musicals', musicalController.createMusical);
router.put('/musicals/:slug', musicalController.updateMusical);
router.delete('/musicals/:slug', musicalController.deleteMusical);
router.patch('/musicals/:slug/toggle', musicalController.toggleMusical);

// 3. Artists
router.get('/artists', artistController.getArtists);
router.post('/artists', artistController.createArtist);
router.put('/artists/:id', artistController.updateArtist);
router.delete('/artists/:id', artistController.deleteArtist);

// 4. Auditoriums & Schedules
router.get('/auditoriums', scheduleController.getAuditoriums);
router.post('/auditoriums', scheduleController.createAuditorium);
router.put('/auditoriums/:code', scheduleController.updateAuditorium);
router.patch('/auditoriums/:code/toggle', scheduleController.toggleAuditorium);
router.post('/schedules', scheduleController.createSchedule);
router.put('/schedules/:id', scheduleController.updateSchedule);
router.patch('/schedules/:id/cancel', scheduleController.cancelSchedule);

// 5. Seat Locking
router.post('/seats/lock', seatController.lockSeats);
router.post('/seats/unlock', seatController.unlockSeats);

// 6. Orders & Refunds
router.get('/orders', bookingController.getAdminOrders);
router.post('/orders/:id/refund', bookingController.refundOrder);

// 7. Vouchers
router.get('/vouchers', voucherController.getAdminVouchers);
router.post('/vouchers', voucherController.createVoucher);
router.patch('/vouchers/:id/toggle', voucherController.toggleVoucher);

// 8. Staff Users (RBAC)
router.get('/users', authController.getUsers);
router.post('/users', authController.createUser);
router.put('/users/:id', authController.updateUser);
router.patch('/users/:id/toggle', authController.toggleUser);
router.delete('/users/:id', authController.deleteUser);

// 9. Subscribers / Leads
router.get('/subscribers', subscriberController.getAdminSubscribers);
router.delete('/subscribers/:id', subscriberController.deleteSubscriber);

// 10. System Audit Log
router.get('/audit-logs', auditLogController.getAuditLogs);
router.get('/audit-logs/status', auditLogController.getStatus);
router.post('/audit-logs/toggle', auditLogController.toggleStatus);
router.delete('/audit-logs', auditLogController.clearLogs);

module.exports = router;
