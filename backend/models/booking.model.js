/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL WEBSITE) - BACKEND
 * File: models/booking.model.js
 * Chức năng: Mongoose Schema cho Đơn Đặt Vé, E-Ticket QR & Check-in
 * ============================================================
 */

const mongoose = require('mongoose');

const BookedSeatSchema = new mongoose.Schema(
  {
    seatCode: { type: String, required: true },
    floor: { type: String, default: 'Tầng Trệt' },
    row: { type: String, required: true },
    number: { type: Number, required: true },
    type: { type: String, enum: ['VIP', 'Standard', 'Couple'], default: 'Standard' },
    price: { type: Number, required: true }
  },
  { _id: false }
);

const BookingSchema = new mongoose.Schema(
  {
    bookingCode: {
      type: String,
      unique: true,
      index: true
    },
    musicalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Musical',
      required: true
    },
    musicalTitle: {
      type: String,
      required: true
    },
    musicalSlug: {
      type: String,
      required: true
    },
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule',
      required: true
    },
    performanceDate: {
      type: Date,
      required: true
    },
    performanceTime: {
      type: String,
      required: true
    },
    venue: {
      type: String,
      default: 'Nhà Hát Thành Phố HCM'
    },
    hall: {
      type: String,
      default: 'Khán phòng Grand A'
    },
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true
    },
    seats: {
      type: [BookedSeatSchema],
      required: true,
      validate: [v => v.length > 0, 'Phải chọn ít nhất 1 ghế']
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    subtotal: {
      type: Number,
      required: true
    },
    voucherCode: {
      type: String,
      default: null
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    totalPrice: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ['VNPAY', 'MOMO', 'ZALOPAY', 'VIETQR', 'BANK_CARD'],
      default: 'VIETQR'
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PAID'
    },
    bookingStatus: {
      type: String,
      enum: ['CONFIRMED', 'CHECKED_IN', 'CANCELLED'],
      default: 'CONFIRMED'
    },
    qrCodeData: {
      type: String
    },
    checkInInfo: {
      checkedInAt: { type: Date, default: null },
      checkedInBy: { type: String, default: null },
      gate: { type: String, default: 'Cửa Chính Khán Phòng A' }
    },
    refundInfo: {
      refundedAt: { type: Date, default: null },
      refundAmount: { type: Number, default: 0 },
      refundReason: { type: String, default: null },
      refundFee: { type: Number, default: 0 }
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

BookingSchema.pre('save', function (next) {
  if (!this.bookingCode) {
    const randomChars = Math.random().toString(36).substring(2, 7).toUpperCase();
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    this.bookingCode = `NK-${datePrefix}-${randomChars}`;
  }
  if (!this.qrCodeData) {
    this.qrCodeData = JSON.stringify({
      code: this.bookingCode,
      show: this.musicalTitle,
      date: this.performanceDate,
      time: this.performanceTime,
      seats: this.seats.map(s => s.seatCode).join(', ')
    });
  }
  next();
});

module.exports = mongoose.model('Booking', BookingSchema);
