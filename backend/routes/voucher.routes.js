/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: routes/voucher.routes.js
 * ============================================================
 */

const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucher.controller');

router.post('/validate', voucherController.validateVoucher);

module.exports = router;
