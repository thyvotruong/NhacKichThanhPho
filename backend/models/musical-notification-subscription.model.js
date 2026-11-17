const mongoose = require('mongoose');

const MusicalNotificationSubscriptionSchema = new mongoose.Schema(
  {
    musicalSlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    }
  },
  { timestamps: true }
);

MusicalNotificationSubscriptionSchema.index(
  { musicalSlug: 1, email: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  'MusicalNotificationSubscription',
  MusicalNotificationSubscriptionSchema
);
