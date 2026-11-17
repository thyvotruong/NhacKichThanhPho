/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL WEBSITE) - BACKEND
 * File: models/artist.model.js
 * Chức năng: Mongoose Schema cho Nghệ sĩ & Đạo diễn Sân khấu
 * ============================================================
 */

const mongoose = require('mongoose');

const ArtistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên nghệ sĩ là bắt buộc'],
      trim: true
    },
    role: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      trim: true
    },
    avatar: {
      type: String,
      required: true,
      trim: true
    },
    bio: {
      type: String,
      trim: true
    },
    featuredMusicals: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Artist', ArtistSchema);
