const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pickup: { type: String, required: true },
  drop: { type: String, required: true },
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'in-progress', 'completed', 'no-show'],
    default: 'pending'
  },

  // ✅ FIXED: This field was missing
  adminAction: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminAction' },

  rideType: {
    type: String,
    enum: ['one-way', 'round-trip', 'recurring', 'emergency', 'airport-transfer'],
    default: 'one-way'
  },
  vehicleType: {
    type: String,
    enum: ['sedan', 'suv', 'luxury', 'van', 'bus'],
    default: 'sedan'
  },

  locations: {
    pickup: {
      address: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number }
      },
      landmark: { type: String }
    },
    drop: {
      address: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number }
      },
      landmark: { type: String }
    }
  },

  timing: {
    scheduledPickup: { type: Date },
    scheduledDrop: { type: Date },
    actualPickup: { type: Date },
    actualDrop: { type: Date },
    estimatedDuration: { type: Number },
    actualDuration: { type: Number }
  },

  vehicle: {
    type: { type: String, enum: ['sedan', 'suv', 'luxury', 'van', 'bus'], default: 'sedan' },
    model: { type: String },
    color: { type: String },
    plateNumber: { type: String }
  },

  driver: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    name: { type: String },
    phone: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    photo: { type: String }
  },

  pricing: {
    baseFare: { type: Number, default: 0 },
    distanceFare: { type: Number, default: 0 },
    timeFare: { type: Number, default: 0 },
    totalFare: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    isPaid: { type: Boolean, default: false },
    paymentMethod: { type: String, enum: ['cash', 'card', 'wallet', 'corporate'], default: 'corporate' }
  },

  distance: {
    estimated: { type: Number },
    actual: { type: Number },
    route: { type: String }
  },

  passengers: {
    count: { type: Number, default: 1, min: 1, max: 50 },
    names: [{ type: String }],
    specialRequirements: { type: String }
  },

  recurring: {
    isRecurring: { type: Boolean, default: false },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
    daysOfWeek: [{ type: Number, min: 0, max: 6 }],
    endDate: { type: Date },
    parentRide: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' }
  },

  notifications: {
    sent: [{
      type: { type: String, enum: ['pickup-reminder', 'driver-assigned', 'ride-started', 'ride-completed'] },
      sentAt: { type: Date, default: Date.now },
      channel: { type: String, enum: ['email', 'sms', 'push'] }
    }],
    scheduled: [{
      type: { type: String },
      scheduledFor: { type: Date },
      channel: { type: String }
    }]
  },

  rating: {
    userRating: { type: Number, min: 1, max: 5 },
    userFeedback: { type: String },
    driverRating: { type: Number, min: 1, max: 5 },
    driverFeedback: { type: String },
    ratedAt: { type: Date }
  },

  cancellation: {
    cancelledBy: { type: String, enum: ['user', 'admin', 'driver', 'system'] },
    reason: { type: String },
    cancelledAt: { type: Date },
    refundAmount: { type: Number }
  },

  flags: {
    isUrgent: { type: Boolean, default: false },
    isCorporate: { type: Boolean, default: true },
    requiresApproval: { type: Boolean, default: true },
    isAutoApproved: { type: Boolean, default: false },
    isModified: { type: Boolean, default: false }
  },

  metadata: {
    ipAddress: { type: String },
    userAgent: { type: String },
    bookingSource: { type: String, enum: ['web', 'mobile', 'api'], default: 'web' },
    tags: [{ type: String }]
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ Virtual fields
rideSchema.virtual('duration').get(function () {
  if (this.timing.actualPickup && this.timing.actualDrop) {
    return Math.round((this.timing.actualDrop - this.timing.actualPickup) / (1000 * 60));
  }
  return this.timing.estimatedDuration || 0;
});

rideSchema.virtual('isOverdue').get(function () {
  return this.status === 'approved' && this.date < new Date();
});

rideSchema.virtual('isToday').get(function () {
  const today = new Date();
  const rideDate = new Date(this.date);
  return rideDate.toDateString() === today.toDateString();
});

// ✅ Pre-save: auto-fill pickup if not set
rideSchema.pre('save', function (next) {
  if (!this.timing.scheduledPickup && this.date) {
    this.timing.scheduledPickup = this.date;
  }
  next();
});

// ✅ Static methods
rideSchema.statics.findOverdue = function () {
  return this.find({ status: 'approved', date: { $lt: new Date() } });
};

rideSchema.statics.findTodaysRides = function () {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  return this.find({ date: { $gte: start, $lt: end } });
};

// ✅ Indexes
rideSchema.index({ user: 1, date: -1 });
rideSchema.index({ status: 1 });
rideSchema.index({ date: 1 });

module.exports = mongoose.model('Ride', rideSchema);
