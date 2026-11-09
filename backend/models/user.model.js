/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL WEBSITE) - BACKEND
 * File: models/user.model.js
 * Chức năng: Mongoose Schema cho Người dùng & Nhân sự nội bộ RBAC
 * Roles: 'customer', 'admin', 'editor', 'accountant', 'ticket_checker'
 * ============================================================
 */

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    password: {
      type: String,
      default: 'showman2026'
    },
    role: {
      type: String,
      enum: ['customer', 'admin', 'editor', 'accountant', 'ticket_checker'],
      default: 'customer'
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', UserSchema);
