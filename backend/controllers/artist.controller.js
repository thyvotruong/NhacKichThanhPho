/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: controllers/artist.controller.js
 * Chức năng: Controller Quản lý Hồ sơ Nghệ sĩ
 * ============================================================
 */

const artistService = require('../services/artist.service');

class ArtistController {
  async getArtists(req, res) {
    try {
      const artists = await artistService.getArtists();
      return res.status(200).json({ success: true, count: artists.length, data: artists });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createArtist(req, res) {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ success: false, message: 'Tên nghệ sĩ là bắt buộc' });
      const created = await artistService.createArtist(req.body, req);
      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async updateArtist(req, res) {
    try {
      const updated = await artistService.updateArtist(req.params.id, req.body, req);
      if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy nghệ sĩ' });
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async deleteArtist(req, res) {
    try {
      const deleted = await artistService.deleteArtist(req.params.id, req);
      if (!deleted) return res.status(404).json({ success: false, message: 'Không tìm thấy nghệ sĩ' });
      return res.status(200).json({ success: true, message: 'Đã xóa nghệ sĩ', data: deleted });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new ArtistController();
