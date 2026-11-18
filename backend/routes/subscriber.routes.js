/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: routes/subscriber.routes.js
 * ============================================================
 */

const express = require('express');
const router = express.Router();
const subscriberController = require('../controllers/subscriber.controller');

router.post('/', subscriberController.createSubscriber);

module.exports = router;
