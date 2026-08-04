const mongoose = require('mongoose');

const authSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'worker', 'dispatcher'],
      default: 'worker',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'on-leave'],
      default: 'active',
    },
    refreshToken: {
      type: String,
      select: false,
      default: null,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
      default: null,
    },
    // Live tracking operational fields
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
    lastPing: {
      type: Date,
      default: null,
    },
    batteryLevel: {
      type: Number,
      default: null,
    },
    accuracy: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

authSchema.index({ role: 1, status: 1 });
authSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('User', authSchema);