/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: controllers/voucher.controller.js
 * Chức năng: Controller Xử lý Mã Giảm Giá & Chương Trình Khuyến Mãi
 * ============================================================
 */

const voucherService = require('../services/voucher.service');

class VoucherController {
  async validateVoucher(req, res) {
    try {
      const { code, subtotal } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập mã giảm giá' });
      }
      const result = await voucherService.validateVoucher(code, subtotal || 0);
      return res.status(200).json({ success: true, message: 'Áp dụng mã giảm giá thành công!', data: result });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async getAdminVouchers(req, res) {
    try {
      const vouchers = await voucherService.getVouchers();
      return res.status(200).json({ success: true, count: vouchers.length, data: vouchers });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createVoucher(req, res) {
    try {
      const { code, discountValue } = req.body;
      if (!code || !discountValue) {
        return res.status(400).json({ success: false, message: 'Mã giảm giá và giá trị chiết khấu là bắt buộc' });
      }
      const newVoucher = await voucherService.createVoucher(req.body, req);
      return res.status(201).json({ success: true, data: newVoucher });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async toggleVoucher(req, res) {
    try {
      const voucher = await voucherService.toggleVoucher(req.params.id, req);
      return res.status(200).json({ success: true, data: voucher });
    } catch (err) {
      return res.status(404).json({ success: false, message: err.message });
    }
  }
}

module.exports = new VoucherController();
