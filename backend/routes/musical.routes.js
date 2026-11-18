/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: routes/musical.routes.js
 * ============================================================
 */

const express = require('express');
const router = express.Router();
const musicalController = require('../controllers/musical.controller');

router.get('/', musicalController.getMusicals);
router.post('/', musicalController.createMusical);
router.get('/:slug', musicalController.getMusicalBySlug);
router.put('/:slug', musicalController.updateMusical);
router.delete('/:slug', musicalController.deleteMusical);
router.patch('/:slug/toggle', musicalController.toggleMusical);
router.post('/:slug/notifications', musicalController.subscribeNotification);

module.exports = router;
