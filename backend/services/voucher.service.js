/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: services/voucher.service.js
 * Model: Voucher (Collection: vouchers)
 * Chức năng: Thao tác Mã giảm giá, Kiểm tra hợp lệ & Quản trị khuyến mãi
 * ============================================================
 */

const Voucher = require('../models/voucher.model');
const store = require('../config/store');

class VoucherService {
  async validateVoucher(code, subtotal) {
    const q = (code || '').toUpperCase();
    let voucher = null;

    if (store.isMongoConnected) {
      try {
        voucher = await Voucher.findOne({ code: q, isActive: true });
      } catch (e) {}
    }
    if (!voucher) {
      voucher = store.memVouchers.find(v => v.code === q && v.isActive);
    }

    if (!voucher) {
      throw new Error('Mã giảm giá không hợp lệ hoặc đã hết hạn');
    }

    if (voucher.validUntil && new Date(voucher.validUntil) < new Date()) {
      throw new Error('Mã giảm giá đã quá hạn sử dụng');
    }

    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
      throw new Error('Mã giảm giá đã hết lượt sử dụng');
    }

    if (voucher.minOrderValue && subtotal < voucher.minOrderValue) {
      throw new Error(`Đơn hàng tối thiểu phải từ ${voucher.minOrderValue.toLocaleString('vi-VN')} đ`);
    }

    let discountAmount = 0;
    if (voucher.discountType === 'PERCENT') {
      discountAmount = Math.round((subtotal * voucher.discountValue) / 100);
      if (voucher.maxDiscountAmount && discountAmount > voucher.maxDiscountAmount) {
        discountAmount = voucher.maxDiscountAmount;
      }
    } else {
      discountAmount = voucher.discountValue;
    }

    return {
      code: voucher.code,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      discountAmount,
      finalPrice: Math.max(0, subtotal - discountAmount),
      description: voucher.description
    };
  }

  async getVouchers() {
    if (store.isMongoConnected) {
      try {
        const vouchers = await Voucher.find();
        if (vouchers && vouchers.length > 0) return vouchers;
      } catch (e) {}
    }
    return store.memVouchers;
  }

  async createVoucher(voucherData, req) {
    const newVoucher = {
      _id: 'vouch_' + Date.now(),
      ...voucherData,
      usedCount: 0,
      isActive: true,
      createdAt: new Date()
    };

    if (store.isMongoConnected) {
      try {
        await Voucher.create(newVoucher);
      } catch (e) {}
    }
    store.memVouchers.push(newVoucher);

    await store.logAudit(req, {
      action: 'CREATE_VOUCHER',
      category: 'VOUCHER',
      description: `Tạo mã ưu đãi ${newVoucher.code} (${newVoucher.discountValue}${newVoucher.discountType === 'PERCENT' ? '%' : 'đ'})`,
      metadata: { voucherCode: newVoucher.code }
    });

    return newVoucher;
  }

  async toggleVoucher(id, req) {
    const v = store.memVouchers.find(item => item._id === id || item.code === id);
    if (!v) throw new Error('Không tìm thấy mã giảm giá');

    v.isActive = !v.isActive;
    if (store.isMongoConnected) {
      try {
        await Voucher.updateOne({ _id: v._id }, { $set: { isActive: v.isActive } });
      } catch (e) {}
    }

    await store.logAudit(req, {
      action: 'TOGGLE_VOUCHER',
      category: 'VOUCHER',
      description: `${v.isActive ? 'Kích hoạt' : 'Tạm dừng'} mã ưu đãi ${v.code}`,
      metadata: { voucherCode: v.code, isActive: v.isActive }
    });

    return v;
  }
}

module.exports = new VoucherService();
