const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient Information
  recipient: {
    type: { type: String, enum: ['user', 'driver', 'admin'], required: true },
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
    email: { type: String },
    phone: { type: String },
    name: { type: String }
  },
  
  // Notification Content
  type: { 
    type: String, 
    enum: [
      'ride-booked', 'ride-approved', 'ride-rejected', 'ride-cancelled',
      'driver-assigned', 'pickup-reminder', 'ride-started', 'ride-completed',
      'payment-success', 'payment-failed', 'account-verified', 'password-reset',
      'welcome', 'system-maintenance', 'promotional', 'emergency'
    ],
    required: true 
  },
  
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed }, // Additional data for the notification
  
  // Delivery Channels
  channels: {
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: false },
    inApp: { type: Boolean, default: true }
  },
  
  // Scheduling
  scheduledFor: { type: Date },
  sentAt: { type: Date },
  expiresAt: { type: Date },
  
  // Delivery Status
  status: { 
    type: String, 
    enum: ['pending', 'scheduled', 'sent', 'delivered', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  // Delivery Tracking
  delivery: {
    email: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      delivered: { type: Boolean, default: false },
      deliveredAt: { type: Date },
      opened: { type: Boolean, default: false },
      openedAt: { type: Date },
      error: { type: String }
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      delivered: { type: Boolean, default: false },
      deliveredAt: { type: Date },
      error: { type: String }
    },
    push: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      delivered: { type: Boolean, default: false },
      deliveredAt: { type: Date },
      clicked: { type: Boolean, default: false },
      clickedAt: { type: Date },
      error: { type: String }
    },
    inApp: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      read: { type: Boolean, default: false },
      readAt: { type: Date }
    }
  },
  
  // Priority and Importance
  priority: { 
    type: String, 
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Template Information
  template: {
    name: { type: String },
    version: { type: String },
    language: { type: String, default: 'en' }
  },
  
  // Related Entities
  relatedRide: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
  relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  relatedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  
  // Retry Logic
  retryCount: { type: Number, default: 0 },
  maxRetries: { type: Number, default: 3 },
  nextRetryAt: { type: Date },
  
  // Metadata
  metadata: {
    ipAddress: { type: String },
    userAgent: { type: String },
    source: { type: String, enum: ['system', 'manual', 'api'], default: 'system' },
    tags: [{ type: String }]
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for isRead
notificationSchema.virtual('isRead').get(function() {
  return this.delivery.inApp.read;
});

// Virtual for isDelivered
notificationSchema.virtual('isDelivered').get(function() {
  return this.delivery.email.delivered || 
         this.delivery.sms.delivered || 
         this.delivery.push.delivered || 
         this.delivery.inApp.sent;
});

// Virtual for isExpired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Virtual for canRetry
notificationSchema.virtual('canRetry').get(function() {
  return this.status === 'failed' && 
         this.retryCount < this.maxRetries && 
         (!this.nextRetryAt || this.nextRetryAt <= new Date());
});

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  // Set default expiration if not provided
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  }
  
  // Set scheduled time if not provided
  if (!this.scheduledFor) {
    this.scheduledFor = new Date();
  }
  
  next();
});

// Static method to find pending notifications
notificationSchema.statics.findPending = function() {
  return this.find({
    status: 'pending',
    scheduledFor: { $lte: new Date() },
    expiresAt: { $gt: new Date() }
  });
};

// Static method to find failed notifications for retry
notificationSchema.statics.findFailedForRetry = function() {
  return this.find({
    status: 'failed',
    retryCount: { $lt: '$maxRetries' },
    $or: [
      { nextRetryAt: { $exists: false } },
      { nextRetryAt: { $lte: new Date() } }
    ]
  });
};

// Static method to find unread notifications for a user
notificationSchema.statics.findUnread = function(recipientId, recipientType = 'user') {
  return this.find({
    'recipient.id': recipientId,
    'recipient.type': recipientType,
    'delivery.inApp.read': false,
    status: { $in: ['sent', 'delivered'] }
  }).sort({ createdAt: -1 });
};

// Static method to mark as read
notificationSchema.statics.markAsRead = function(notificationId, recipientId) {
  return this.updateOne(
    { 
      _id: notificationId, 
      'recipient.id': recipientId 
    },
    { 
      'delivery.inApp.read': true,
      'delivery.inApp.readAt': new Date()
    }
  );
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function(recipientId, recipientType = 'user') {
  return this.updateMany(
    { 
      'recipient.id': recipientId,
      'recipient.type': recipientType,
      'delivery.inApp.read': false
    },
    { 
      'delivery.inApp.read': true,
      'delivery.inApp.readAt': new Date()
    }
  );
};

// Indexes for better performance
notificationSchema.index({ 'recipient.id': 1, 'recipient.type': 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ 'delivery.inApp.read': 1 });

module.exports = mongoose.model('Notification', notificationSchema); 