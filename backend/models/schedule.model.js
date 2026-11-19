/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL WEBSITE) - BACKEND
 * File: models/schedule.model.js
 * Chức năng: Mongoose Schema cho Lịch diễn & Sơ đồ ghế thời gian thực
 * ============================================================
 */

const mongoose = require('mongoose');
const { SeatSchema } = require('./seat.model');

const ScheduleSchema = new mongoose.Schema(
  {
    _id: {
      type: String
    },
    musicalId: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Mã vở nhạc kịch là bắt buộc']
    },
    musicalTitle: {
      type: String,
      required: true
    },
    musicalSlug: {
      type: String,
      required: true
    },
    genre: {
      type: String
    },
    posterUrl: {
      type: String
    },
    subtitle: {
      type: String
    },
    performanceDate: {
      type: Date,
      required: [true, 'Ngày diễn là bắt buộc']
    },
    time: {
      type: String,
      required: [true, 'Khung giờ diễn là bắt buộc']
    },
    venue: {
      type: String,
      default: 'Nhạc kịch Thành phố - 669 Đỗ Mười, khu phố 3, Linh Xuân, TP.HCM'
    },
    hall: {
      type: String,
      default: 'Khán phòng Grand A'
    },
    totalSeats: {
      type: Number,
      default: 120
    },
    bookedSeats: {
      type: Number,
      default: 0
    },
    lockedSeatsCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['available', 'sold_out', 'cancelled'],
      default: 'available'
    },
    seats: [SeatSchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Schedule', ScheduleSchema);
