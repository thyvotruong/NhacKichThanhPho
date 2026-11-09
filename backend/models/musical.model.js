/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL WEBSITE) - BACKEND
 * File: models/musical.model.js
 * Chức năng: Mongoose Schema cho Vở Diễn (Musicals) theo BA
 * ============================================================
 */

const mongoose = require('mongoose');

const TicketTierSchema = new mongoose.Schema(
  {
    tier: {
      type: String,
      required: [true, 'Hạng vé không được để trống'],
      enum: ['VIP', 'Standard', 'Couple'],
      default: 'Standard'
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Giá vé không được để trống'],
      min: [0, 'Giá vé không thể âm']
    },
    color: {
      type: String,
      default: '#F59E0B'
    },
    description: {
      type: String,
      trim: true
    }
  },
  { _id: false }
);

const MusicalSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tên vở nhạc kịch là bắt buộc'],
      trim: true
    },
    slug: {
      type: String,
      required: [true, 'Slug định danh SEO là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    subtitle: {
      type: String,
      trim: true
    },
    genre: {
      type: String,
      required: true,
      enum: ['Broadway', 'Cổ Điển', 'Dân Gian Đương Đại', 'Lãng Mạn', 'Thiếu Nhi'],
      default: 'Broadway'
    },
    posterUrl: {
      type: String,
      required: true,
      trim: true
    },
    bannerUrl: {
      type: String,
      required: true,
      trim: true
    },
    trailerUrl: {
      type: String,
      trim: true,
      default: 'https://www.youtube.com/embed/RclpGv8673s'
    },
    duration: {
      type: Number, // Thời lượng phút
      required: [true, 'Thời lượng là bắt buộc'],
      min: [1, 'Thời lượng phải lớn hơn 0']
    },
    ageLimit: {
      type: String,
      default: '12+'
    },
    director: {
      type: String,
      required: [true, 'Đạo diễn là bắt buộc'],
      trim: true
    },
    cast: {
      type: [String],
      required: [true, 'Dàn diễn viên là bắt buộc'],
      default: []
    },
    synopsis: {
      type: String,
      required: [true, 'Tóm tắt nội dung là bắt buộc']
    },
    ticketPrices: {
      type: [TicketTierSchema],
      required: true
    },
    featured: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['now_showing', 'coming_soon', 'archived'],
      default: 'now_showing'
    },
    rating: {
      type: Number,
      default: 4.9,
      min: 1,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 128
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

MusicalSchema.virtual('schedules', {
  ref: 'Schedule',
  localField: '_id',
  foreignField: 'musicalId'
});

module.exports = mongoose.model('Musical', MusicalSchema);
