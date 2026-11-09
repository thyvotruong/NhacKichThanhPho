/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL WEBSITE) - BACKEND
 * File: models/reconciliation.model.js
 * Chức năng: Mongoose Schema cho Đối soát doanh thu & Cổng thanh toán
 * ============================================================
 */

const mongoose = require('mongoose');

const ReconciliationSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true
    },
    bookingCode: {
      type: String,
      required: true
    },
    gateway: {
      type: String,
      enum: ['VNPAY', 'MOMO', 'ZALOPAY', 'VIETQR', 'BANK_CARD'],
      required: true
    },
    systemAmount: {
      type: Number,
      required: true
    },
    gatewayAmount: {
      type: Number,
      required: true
    },
    fee: {
      type: Number,
      default: 0
    },
    netAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['MATCHED', 'DISCREPANCY', 'PENDING'],
      default: 'MATCHED'
    },
    transactionDate: {
      type: Date,
      default: Date.now
    },
    reconciledAt: {
      type: Date,
      default: Date.now
    },
    reconciledBy: {
      type: String,
      default: 'Kế toán hệ thống'
    },
    notes: {
      type: String,
      default: 'Khớp lệnh đối soát thành công 100%'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Reconciliation', ReconciliationSchema);
