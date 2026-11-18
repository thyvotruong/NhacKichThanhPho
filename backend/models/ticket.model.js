/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL WEBSITE) - BACKEND
 * File: models/ticket.model.js
 * Chức năng: Mongoose Schema cho Vé Xem Kịch Điện Tử (E-Ticket) & QR Code Check-in
 * ============================================================
 */

const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema(
  {
    _id: {
      type: String
    },
    ticketCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    bookingCode: {
      type: String,
      required: true,
      index: true
    },
    bookingId: {
      type: mongoose.Schema.Types.Mixed
    },
    musicalId: {
      type: mongoose.Schema.Types.Mixed,
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
      type: mongoose.Schema.Types.Mixed,
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
    hall: {
      type: String,
      default: 'Khán phòng Grand A'
    },
    seatCode: {
      type: String,
      required: true
    },
    floor: {
      type: String,
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
    seatType: {
      type: String,
      enum: ['VIP', 'Standard', 'Couple'],
      default: 'Standard'
    },
    price: {
      type: Number,
      required: true
    },
    customerName: {
      type: String,
      default: 'Khán giả Nhà Hát'
    },
    customerEmail: {
      type: String,
      default: ''
    },
    customerPhone: {
      type: String,
      default: ''
    },
    paymentMethod: {
      type: String,
      enum: ['VIETQR', 'VNPAY', 'MOMO', 'ZALOPAY'],
      default: 'VIETQR'
    },
    status: {
      type: String,
      enum: ['VALID', 'USED', 'CANCELLED'],
      default: 'VALID'
    },
    qrCodeData: {
      type: String
    },
    checkedInAt: {
      type: Date,
      default: null
    },
    checkedInBy: {
      type: String,
      default: null
    },
    gate: {
      type: String,
      default: 'Cửa Chính'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Ticket', TicketSchema);
