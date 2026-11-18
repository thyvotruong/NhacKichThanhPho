/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: controllers/subscriber.controller.js
 * Chức năng: Controller Thu thập Email Khách hàng & Quản lý Leads
 * ============================================================
 */

const subscriberService = require('../services/subscriber.service');

class SubscriberController {
  async createSubscriber(req, res) {
    try {
      const { email, source, musicalTitle } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Địa chỉ email là bắt buộc' });
      }
      const newSub = await subscriberService.createSubscriber(email, source, musicalTitle, req);
      return res.status(201).json({
        success: true,
        message: 'Đăng ký nhận bản tin thành công! Cảm ơn bạn đã quan tâm đến Nhà hát Nhạc Kịch Thành Phố.',
        data: newSub
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async getAdminSubscribers(req, res) {
    try {
      const subs = await subscriberService.getSubscribers();
      return res.status(200).json({ success: true, count: subs.length, data: subs });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async deleteSubscriber(req, res) {
    try {
      const deleted = await subscriberService.deleteSubscriber(req.params.id, req);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin đăng ký' });
      }
      return res.status(200).json({ success: true, message: 'Đã xóa bản ghi đăng ký', data: deleted });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new SubscriberController();
