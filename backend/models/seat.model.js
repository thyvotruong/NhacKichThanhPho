/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL WEBSITE) - BACKEND
 * File: models/seat.model.js
 * Chức năng: Mongoose Schema cho Ghế Ngồi, Sơ đồ ghế & Khóa ghế nội bộ
 * ============================================================
 */

const mongoose = require('mongoose');

const SeatSchema = new mongoose.Schema(
  {
    seatCode: {
      type: String,
      required: true
    },
    floor: {
      type: String,
      enum: ['Tầng Trệt', 'Tầng Lầu'],
      default: 'Tầng Trệt'
    },
    row: {
      type: String,
      required: true
    },
    number: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['VIP', 'Standard', 'Couple'],
      default: 'Standard'
    },
    price: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['available', 'holding', 'booked', 'locked'],
      default: 'available'
    },
    holdingSessionId: {
      type: String,
      default: null
    },
    holdingExpiresAt: {
      type: Date,
      default: null
    },
    lockedReason: {
      type: String,
      default: null // Ví dụ: "Báo chí & Truyền thông", "Khách mời danh dự", "Kỹ thuật âm thanh"
    },
    lockedBy: {
      type: String,
      default: null
    },
    lockedAt: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);

module.exports = {
  SeatSchema
};
