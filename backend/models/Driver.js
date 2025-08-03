const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  
  // Profile Information
  profile: {
    photo: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String }
    },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relationship: { type: String }
    }
  },
  
  // License and Documents
  license: {
    number: { type: String, required: true, unique: true },
    expiryDate: { type: Date, required: true },
    issuingAuthority: { type: String },
    isVerified: { type: Boolean, default: false }
  },
  
  documents: {
    idProof: { type: String },
    addressProof: { type: String },
    vehicleRegistration: { type: String },
    insurance: { type: String },
    backgroundCheck: { type: String }
  },
  
  // Vehicle Information
  vehicle: {
    type: { type: String, enum: ['sedan', 'suv', 'luxury', 'van', 'bus'], required: true },
    model: { type: String, required: true },
    make: { type: String, required: true },
    year: { type: Number },
    color: { type: String },
    plateNumber: { type: String, required: true, unique: true },
    capacity: { type: Number, default: 4 },
    features: [{ type: String }], // AC, GPS, etc.
    isVerified: { type: Boolean, default: false }
  },
  
  // Status and Availability
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'suspended', 'on-trip', 'offline'],
    default: 'inactive'
  },
  
  availability: {
    isAvailable: { type: Boolean, default: false },
    workingHours: {
      start: { type: String, default: '06:00' },
      end: { type: String, default: '22:00' }
    },
    workingDays: [{ type: Number, min: 0, max: 6 }], // 0 = Sunday
    currentLocation: {
      coordinates: {
        lat: { type: Number },
        lng: { type: Number }
      },
      address: { type: String },
      lastUpdated: { type: Date }
    },
    serviceAreas: [{
      name: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number }
      },
      radius: { type: Number } // in km
    }]
  },
  
  // Performance and Ratings
  performance: {
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRides: { type: Number, default: 0 },
    completedRides: { type: Number, default: 0 },
    cancelledRides: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    totalDistance: { type: Number, default: 0 }, // in km
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    onTimePercentage: { type: Number, default: 0 },
    lastActive: { type: Date }
  },
  
  // Financial Information
  financial: {
    bankAccount: {
      accountNumber: { type: String },
      ifscCode: { type: String },
      accountHolderName: { type: String }
    },
    wallet: {
      balance: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' }
    },
    commission: {
      percentage: { type: Number, default: 20 }, // 20% commission
      fixedAmount: { type: Number, default: 0 }
    }
  },
  
  // Preferences and Settings
  preferences: {
    maxDistance: { type: Number, default: 50 }, // in km
    preferredRideTypes: [{ type: String }],
    autoAccept: { type: Boolean, default: false },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  },
  
  // Verification and Security
  isVerified: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  verificationToken: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  
  // System Information
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  
  // Metadata
  metadata: {
    registrationDate: { type: Date, default: Date.now },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    notes: { type: String }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for isLocked
driverSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for isOnline
driverSchema.virtual('isOnline').get(function() {
  return this.status === 'active' && this.availability.isAvailable;
});

// Virtual for isAvailableForRide
driverSchema.virtual('isAvailableForRide').get(function() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();
  
  return this.status === 'active' && 
         this.availability.isAvailable &&
         this.isApproved &&
         this.availability.workingDays.includes(currentDay) &&
         currentHour >= parseInt(this.availability.workingHours.start.split(':')[0]) &&
         currentHour <= parseInt(this.availability.workingHours.end.split(':')[0]);
});

// Pre-save middleware
driverSchema.pre('save', function(next) {
  // Calculate average rating
  if (this.performance.totalRatings > 0) {
    this.performance.averageRating = this.performance.rating / this.performance.totalRatings;
  }
  
  // Calculate on-time percentage
  if (this.performance.totalRides > 0) {
    this.performance.onTimePercentage = 
      ((this.performance.completedRides - this.performance.cancelledRides) / this.performance.totalRides) * 100;
  }
  
  next();
});

// Static method to find available drivers
driverSchema.statics.findAvailable = function(location, vehicleType = null) {
  const query = {
    status: 'active',
    'availability.isAvailable': true,
    isApproved: true
  };
  
  if (vehicleType) {
    query['vehicle.type'] = vehicleType;
  }
  
  return this.find(query);
};

// Static method to find drivers by rating
driverSchema.statics.findByRating = function(minRating = 4.0) {
  return this.find({
    'performance.averageRating': { $gte: minRating },
    isApproved: true
  });
};

// Indexes for better performance
driverSchema.index({ email: 1 });
driverSchema.index({ phone: 1 });
driverSchema.index({ 'license.number': 1 });
driverSchema.index({ 'vehicle.plateNumber': 1 });
driverSchema.index({ status: 1 });
driverSchema.index({ isApproved: 1 });
driverSchema.index({ 'availability.currentLocation.coordinates': '2dsphere' });
driverSchema.index({ 'performance.averageRating': -1 });

module.exports = mongoose.model('Driver', driverSchema); 