const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'manager'], default: 'user' },
  isActive: { type: Boolean, default: true },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  
  // Enhanced profile information
  profile: {
    phone: { type: String },
    department: { type: String },
    employeeId: { type: String, unique: true, sparse: true },
    designation: { type: String },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relationship: { type: String }
    }
  },
  
  // Ride preferences
  preferences: {
    preferredPickupTime: { type: String, default: '09:00' },
    preferredDropTime: { type: String, default: '18:00' },
    preferredVehicleType: { type: String, enum: ['sedan', 'suv', 'luxury', 'any'], default: 'any' },
    autoApproval: { type: Boolean, default: false },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    }
  },
  
  // Statistics
  stats: {
    totalRides: { type: Number, default: 0 },
    completedRides: { type: Number, default: 0 },
    cancelledRides: { type: Number, default: 0 },
    totalDistance: { type: Number, default: 0 }, // in km
    lastRideDate: { type: Date }
  },
  
  // Account settings
  settings: {
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' }
  },
  
  // Verification
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  
  // Security
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  lastLogin: { type: Date },
  lastPasswordChange: { type: Date }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Virtual for isLocked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Only hash if password is not already hashed
    if (!this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    }
    this.lastPasswordChange = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: new Date() }
  });
};

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ 'profile.employeeId': 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);