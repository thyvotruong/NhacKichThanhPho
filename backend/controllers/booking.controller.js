/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: controllers/booking.controller.js
 * Chức năng: Controller Xử lý Đặt vé, Hủy vé & Quản lý Đơn hàng
 * ============================================================
 */

const bookingService = require('../services/booking.service');

class BookingController {
  async createBooking(req, res) {
    try {
      const newBooking = await bookingService.createBooking(req.body, req);
      return res.status(201).json({
        success: true,
        message: 'Đặt vé và thanh toán thành công!',
        data: newBooking
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async getMyBookings(req, res) {
    try {
      const email = req.query.email || (req.user && req.user.email);
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email khách hàng là bắt buộc' });
      }
      const bookings = await bookingService.getMyBookings(email);
      return res.status(200).json({ success: true, count: bookings.length, data: bookings });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async cancelBooking(req, res) {
    try {
      const booking = await bookingService.cancelBooking(req.params.bookingCode, req);
      return res.status(200).json({
        success: true,
        message: `Đã hủy đơn vé ${req.params.bookingCode} thành công!`,
        data: booking
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async getAdminOrders(req, res) {
    try {
      const { status, search } = req.query;
      const orders = await bookingService.getAdminOrders({ status, search });
      return res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async refundOrder(req, res) {
    try {
      const { reason } = req.body;
      const order = await bookingService.refundOrder(req.params.id, reason, req);
      return res.status(200).json({
        success: true,
        message: `Đã xử lý hoàn tiền cho đơn vé ${order.bookingCode} thành công!`,
        data: order
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = new BookingController();
