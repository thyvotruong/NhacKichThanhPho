/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: controllers/ops.controller.js
 * Chức năng: Controller Phân hệ Vận hành Soát vé Cửa Rạp (Ops Portal)
 * ============================================================
 */

const bookingService = require('../services/booking.service');

class OpsController {
  async checkInTicket(req, res) {
    try {
      const { qrData, ticketCode, gate } = req.body;
      const target = qrData || ticketCode;
      if (!target) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã vé hoặc dữ liệu QR' });
      }
      const result = await bookingService.checkInTicket(target, gate, req);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  getOpsDashboard(req, res) {
    try {
      const data = bookingService.getOpsDashboard();
      return res.status(200).json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  lookupTicket(req, res) {
    try {
      const { keyword } = req.query;
      const results = bookingService.lookupTicket(keyword);
      return res.status(200).json({ success: true, count: results.length, data: results });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new OpsController();
