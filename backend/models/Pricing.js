const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
  // Pricing Configuration
  name: { type: String, required: true, unique: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  
  // Base Pricing
  baseFare: { type: Number, required: true, min: 0 },
  perKmRate: { type: Number, required: true, min: 0 },
  perMinuteRate: { type: Number, required: true, min: 0 },
  minimumFare: { type: Number, required: true, min: 0 },
  maximumFare: { type: Number, min: 0 },
  
  // Vehicle Type Pricing
  vehicleTypeMultipliers: {
    sedan: { type: Number, default: 1.0 },
    suv: { type: Number, default: 1.2 },
    luxury: { type: Number, default: 1.5 },
    van: { type: Number, default: 1.3 },
    bus: { type: Number, default: 2.0 }
  },
  
  // Time-based Pricing
  timeBasedPricing: {
    peakHours: {
      enabled: { type: Boolean, default: false },
      multiplier: { type: Number, default: 1.2 },
      startTime: { type: String, default: '07:00' },
      endTime: { type: String, default: '09:00' },
      days: [{ type: Number, min: 0, max: 6 }] // 0 = Sunday
    },
    nightHours: {
      enabled: { type: Boolean, default: false },
      multiplier: { type: Number, default: 1.1 },
      startTime: { type: String, default: '22:00' },
      endTime: { type: String, default: '06:00' }
    },
    weekend: {
      enabled: { type: Boolean, default: false },
      multiplier: { type: Number, default: 1.1 },
      days: [{ type: Number, min: 0, max: 6 }] // 5 = Saturday, 6 = Sunday
    }
  },
  
  // Distance-based Pricing
  distanceTiers: [{
    minDistance: { type: Number, required: true }, // in km
    maxDistance: { type: Number }, // in km, null for unlimited
    perKmRate: { type: Number, required: true },
    description: { type: String }
  }],
  
  // Surge Pricing
  surgePricing: {
    enabled: { type: Boolean, default: false },
    baseMultiplier: { type: Number, default: 1.0 },
    maxMultiplier: { type: Number, default: 3.0 },
    factors: {
      demand: { type: Number, default: 0.3 }, // 30% weight for demand
      weather: { type: Number, default: 0.2 }, // 20% weight for weather
      events: { type: Number, default: 0.2 }, // 20% weight for events
      time: { type: Number, default: 0.3 } // 30% weight for time
    }
  },
  
  // Corporate Discounts
  corporateDiscounts: {
    enabled: { type: Boolean, default: true },
    percentage: { type: Number, default: 10, min: 0, max: 100 }, // 10% discount
    minimumRides: { type: Number, default: 0 }, // minimum rides for discount
    maximumDiscount: { type: Number, default: 50 }, // maximum discount amount
    applicableRideTypes: [{ type: String }] // which ride types get discount
  },
  
  // Special Pricing
  specialPricing: {
    airportTransfer: {
      enabled: { type: Boolean, default: false },
      additionalFare: { type: Number, default: 0 },
      description: { type: String }
    },
    emergencyRide: {
      enabled: { type: Boolean, default: false },
      multiplier: { type: Number, default: 1.5 },
      description: { type: String }
    },
    recurringRide: {
      enabled: { type: Boolean, default: false },
      discountPercentage: { type: Number, default: 5, min: 0, max: 100 },
      minimumFrequency: { type: Number, default: 5 }, // minimum rides per month
      description: { type: String }
    }
  },
  
  // Cancellation Fees
  cancellationFees: {
    within1Hour: { type: Number, default: 0 },
    within2Hours: { type: Number, default: 5 },
    within4Hours: { type: Number, default: 10 },
    within24Hours: { type: Number, default: 20 },
    after24Hours: { type: Number, default: 50 }
  },
  
  // Waiting Charges
  waitingCharges: {
    freeWaitTime: { type: Number, default: 5 }, // minutes
    perMinuteCharge: { type: Number, default: 1 }, // per minute after free time
    maxWaitTime: { type: Number, default: 30 } // maximum wait time before cancellation
  },
  
  // Currency and Regional Settings
  currency: { type: String, default: 'USD' },
  region: { type: String, default: 'US' },
  timezone: { type: String, default: 'UTC' },
  
  // Validity Period
  validFrom: { type: Date, default: Date.now },
  validUntil: { type: Date },
  
  // Metadata
  metadata: {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    version: { type: String, default: '1.0' },
    tags: [{ type: String }],
    notes: { type: String }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for isCurrentlyValid
pricingSchema.virtual('isCurrentlyValid').get(function() {
  const now = new Date();
  return this.isActive && 
         this.validFrom <= now && 
         (!this.validUntil || this.validUntil >= now);
});

// Method to calculate fare
pricingSchema.methods.calculateFare = function(rideData) {
  const {
    distance,
    duration,
    vehicleType = 'sedan',
    rideType = 'one-way',
    isEmergency = false,
    isRecurring = false,
    isAirportTransfer = false,
    pickupTime,
    isCorporate = true
  } = rideData;
  
  let baseFare = this.baseFare;
  let totalFare = 0;
  
  // Calculate distance fare
  let distanceFare = 0;
  if (this.distanceTiers && this.distanceTiers.length > 0) {
    // Use tiered pricing
    for (const tier of this.distanceTiers) {
      if (distance >= tier.minDistance && (!tier.maxDistance || distance <= tier.maxDistance)) {
        distanceFare = distance * tier.perKmRate;
        break;
      }
    }
  } else {
    // Use simple per km rate
    distanceFare = distance * this.perKmRate;
  }
  
  // Calculate time fare
  const timeFare = duration * this.perMinuteRate;
  
  // Apply vehicle type multiplier
  const vehicleMultiplier = this.vehicleTypeMultipliers[vehicleType] || 1.0;
  
  // Calculate base total
  totalFare = (baseFare + distanceFare + timeFare) * vehicleMultiplier;
  
  // Apply time-based pricing
  if (pickupTime) {
    const pickupDate = new Date(pickupTime);
    const hour = pickupDate.getHours();
    const day = pickupDate.getDay();
    
    // Peak hours
    if (this.timeBasedPricing.peakHours.enabled) {
      const peakStart = parseInt(this.timeBasedPricing.peakHours.startTime.split(':')[0]);
      const peakEnd = parseInt(this.timeBasedPricing.peakHours.endTime.split(':')[0]);
      if (hour >= peakStart && hour <= peakEnd && 
          this.timeBasedPricing.peakHours.days.includes(day)) {
        totalFare *= this.timeBasedPricing.peakHours.multiplier;
      }
    }
    
    // Night hours
    if (this.timeBasedPricing.nightHours.enabled) {
      const nightStart = parseInt(this.timeBasedPricing.nightHours.startTime.split(':')[0]);
      const nightEnd = parseInt(this.timeBasedPricing.nightHours.endTime.split(':')[0]);
      if ((hour >= nightStart || hour <= nightEnd)) {
        totalFare *= this.timeBasedPricing.nightHours.multiplier;
      }
    }
    
    // Weekend
    if (this.timeBasedPricing.weekend.enabled && 
        this.timeBasedPricing.weekend.days.includes(day)) {
      totalFare *= this.timeBasedPricing.weekend.multiplier;
    }
  }
  
  // Apply special pricing
  if (isEmergency && this.specialPricing.emergencyRide.enabled) {
    totalFare *= this.specialPricing.emergencyRide.multiplier;
  }
  
  if (isAirportTransfer && this.specialPricing.airportTransfer.enabled) {
    totalFare += this.specialPricing.airportTransfer.additionalFare;
  }
  
  if (isRecurring && this.specialPricing.recurringRide.enabled) {
    const discount = totalFare * (this.specialPricing.recurringRide.discountPercentage / 100);
    totalFare -= discount;
  }
  
  // Apply corporate discount
  if (isCorporate && this.corporateDiscounts.enabled) {
    const discount = totalFare * (this.corporateDiscounts.percentage / 100);
    const maxDiscount = this.corporateDiscounts.maximumDiscount;
    const finalDiscount = Math.min(discount, maxDiscount);
    totalFare -= finalDiscount;
  }
  
  // Apply minimum and maximum fare limits
  totalFare = Math.max(totalFare, this.minimumFare);
  if (this.maximumFare) {
    totalFare = Math.min(totalFare, this.maximumFare);
  }
  
  return {
    baseFare,
    distanceFare,
    timeFare,
    vehicleMultiplier,
    totalFare: Math.round(totalFare * 100) / 100, // Round to 2 decimal places
    breakdown: {
      baseFare,
      distanceFare,
      timeFare,
      vehicleMultiplier,
      specialPricing: {
        emergency: isEmergency && this.specialPricing.emergencyRide.enabled,
        airportTransfer: isAirportTransfer && this.specialPricing.airportTransfer.enabled,
        recurring: isRecurring && this.specialPricing.recurringRide.enabled
      },
      corporateDiscount: isCorporate && this.corporateDiscounts.enabled
    }
  };
};

// Static method to get active pricing
pricingSchema.statics.getActive = function() {
  const now = new Date();
  return this.findOne({
    isActive: true,
    validFrom: { $lte: now },
    $or: [
      { validUntil: { $exists: false } },
      { validUntil: { $gte: now } }
    ]
  });
};

// Indexes for better performance
pricingSchema.index({ isActive: 1 });
pricingSchema.index({ validFrom: 1, validUntil: 1 });
pricingSchema.index({ region: 1 });
pricingSchema.index({ currency: 1 });

module.exports = mongoose.model('Pricing', pricingSchema); 