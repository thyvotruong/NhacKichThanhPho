/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: routes/auth.routes.js
 * ============================================================
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/check-user', authController.checkUser);
router.post('/login', authController.login);
router.post('/staff-login', authController.staffLogin);
router.post('/register', authController.register);
router.post('/reset-password', authController.resetPassword);
router.post('/change-password', authController.changePassword);

module.exports = router;
