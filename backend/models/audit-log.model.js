const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    category: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      default: 'SYSTEM'
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    performer: {
      username: { type: String, default: 'admin' },
      fullName: { type: String, default: 'Quản Trị Viên' },
      role: { type: String, default: 'admin' }
    },
    ipAddress: {
      type: String,
      trim: true,
      default: '127.0.0.1'
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      default: 'SUCCESS'
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ category: 1 });
AuditLogSchema.index({ 'performer.username': 1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
