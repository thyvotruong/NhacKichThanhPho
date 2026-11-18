/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: controllers/seat.controller.js
 * Chức năng: Controller Xử lý Sơ đồ Ghế, Giữ ghế 8p & Khóa ghế nội bộ
 * ============================================================
 */

const seatService = require('../services/seat.service');

class SeatController {
  async getSeats(req, res) {
    try {
      const seats = await seatService.getSeatsByScheduleId(req.params.scheduleId);
      if (!seats) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy sơ đồ ghế cho suất diễn này' });
      }
      return res.status(200).json({ success: true, count: seats.length, data: seats });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async holdSeats(req, res) {
    try {
      const { seatCodes, sessionId } = req.body;
      const { scheduleId } = req.params;

      if (!seatCodes || !Array.isArray(seatCodes) || seatCodes.length === 0 || !sessionId) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin ghế cần giữ hoặc session ID' });
      }

      const result = await seatService.holdSeats(scheduleId, seatCodes, sessionId);
      return res.status(200).json({
        success: true,
        message: `Đã giữ tạm ${seatCodes.length} ghế trong 8 phút (BPMN 2.2.3)`,
        data: result
      });
    } catch (err) {
      return res.status(409).json({ success: false, message: err.message });
    }
  }

  async releaseSeats(req, res) {
    try {
      const { seatCodes, sessionId } = req.body;
      const { scheduleId } = req.params;

      if (!seatCodes || !Array.isArray(seatCodes) || seatCodes.length === 0) {
        return res.status(400).json({ success: false, message: 'Thiếu danh sách ghế cần nhả' });
      }

      const result = await seatService.releaseSeats(scheduleId, seatCodes, sessionId);
      return res.status(200).json({ success: true, message: 'Đã giải phóng ghế giữ tạm', data: result });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async lockSeats(req, res) {
    try {
      const { scheduleId, seatCodes, reason, lockedBy } = req.body;

      if (!scheduleId || !seatCodes || !Array.isArray(seatCodes) || seatCodes.length === 0) {
        return res.status(400).json({ success: false, message: 'Dữ liệu khóa ghế không hợp lệ' });
      }

      const result = await seatService.lockSeats(scheduleId, seatCodes, reason, lockedBy, req);
      return res.status(200).json({
        success: true,
        message: `Đã khóa thành công ${seatCodes.length} ghế cho mục đích nội bộ!`,
        data: result
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async unlockSeats(req, res) {
    try {
      const { scheduleId, seatCodes } = req.body;

      if (!scheduleId || !seatCodes || !Array.isArray(seatCodes) || seatCodes.length === 0) {
        return res.status(400).json({ success: false, message: 'Dữ liệu mở khóa ghế không hợp lệ' });
      }

      const result = await seatService.unlockSeats(scheduleId, seatCodes, req);
      return res.status(200).json({
        success: true,
        message: `Đã mở khóa thành công ${seatCodes.length} ghế!`,
        data: result
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = new SeatController();
