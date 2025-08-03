const mongoose = require('mongoose');

const adminActionSchema = new mongoose.Schema({
  ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['approve', 'reject'], required: true },
  reason: { type: String },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AdminAction', adminActionSchema);