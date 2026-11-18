const mongoose = require('mongoose');

const SubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    source: {
      type: String,
      required: true,
      trim: true,
      default: 'homepage_vip'
    },
    musicalTitle: {
      type: String,
      trim: true,
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Tránh duplicate email theo cùng một nguồn và cùng một vở kịch
SubscriberSchema.index({ email: 1, source: 1, musicalTitle: 1 }, { unique: true });

module.exports = mongoose.model('Subscriber', SubscriberSchema);
