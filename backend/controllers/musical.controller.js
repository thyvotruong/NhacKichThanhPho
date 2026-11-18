/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: controllers/musical.controller.js
 * Chức năng: Controller Xử lý Nghiệp vụ Vở Nhạc Kịch
 * ============================================================
 */

const musicalService = require('../services/musical.service');

class MusicalController {
  async getMusicals(req, res) {
    try {
      const { genre, status, search } = req.query;
      const musicals = await musicalService.getMusicals({ genre, status, search });
      return res.status(200).json({ success: true, count: musicals.length, data: musicals });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getMusicalBySlug(req, res) {
    try {
      const musical = await musicalService.getMusicalBySlug(req.params.slug);
      if (!musical) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy vở kịch' });
      }
      return res.status(200).json({ success: true, data: musical });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async subscribeNotification(req, res) {
    try {
      const { email, phone, name } = req.body;
      if (!email && !phone) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ít nhất email hoặc số điện thoại' });
      }
      const subscription = await musicalService.subscribeNotification(req.params.slug, { email, phone, name });
      return res.status(201).json({ success: true, message: 'Đăng ký nhận thông báo thành công!', data: subscription });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async getAdminMusicals(req, res) {
    try {
      const musicals = await musicalService.getMusicals();
      return res.status(200).json({ success: true, count: musicals.length, data: musicals });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createMusical(req, res) {
    try {
      const { title, slug } = req.body;
      if (!title || !slug) {
        return res.status(400).json({ success: false, message: 'Tên vở kịch và slug là bắt buộc' });
      }
      const created = await musicalService.createMusical(req.body, req);
      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async updateMusical(req, res) {
    try {
      const target = req.params.slug || req.params.id;
      const updated = await musicalService.updateMusical(target, req.body, req);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy vở kịch' });
      }
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async deleteMusical(req, res) {
    try {
      const target = req.params.slug || req.params.id;
      const deleted = await musicalService.deleteMusical(target, req);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy vở kịch' });
      }
      return res.status(200).json({ success: true, message: 'Đã xóa vở kịch thành công', data: deleted });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async toggleMusical(req, res) {
    try {
      const updated = await musicalService.toggleMusical(req.params.slug, req);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy vở kịch' });
      }
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new MusicalController();
