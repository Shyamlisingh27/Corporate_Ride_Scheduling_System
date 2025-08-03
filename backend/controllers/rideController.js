const Ride = require('../models/Ride');
const AuditLog = require('../models/AuditLog');

// Create a new ride request
exports.createRide = async (req, res) => {
  try {
    console.log('createRide called with body:', req.body);
    const { pickup, drop, date, vehicleType, rideType } = req.body;
    
    if (!pickup || !drop || !date) {
      return res.status(400).json({ message: 'Please provide pickup, drop, and date' });
    }
    
    const ride = new Ride({
      user: req.user._id,
      pickup: pickup,
      drop: drop,
      date: new Date(date),
      status: 'pending',
      rideType: rideType || 'one-way',
      vehicleType: vehicleType || 'sedan',
      locations: {
        pickup: {
          address: pickup
        },
        drop: {
          address: drop
        }
      },
      timing: {
        scheduledPickup: new Date(date)
      },
      vehicle: {
        type: vehicleType || 'sedan'
      },
      pricing: {
        baseFare: 0,
        totalFare: 0,
        currency: 'USD',
        isPaid: false,
        paymentMethod: 'corporate'
      },
      passengers: {
        count: 1
      },
      flags: {
        isCorporate: true,
        requiresApproval: true
      },
      metadata: {
        bookingSource: 'web'
      }
    });
    
    console.log('Ride object created:', ride);
    await ride.save();
    console.log('Ride saved successfully');
    
    try {
      await AuditLog.create({ user: req.user._id, action: 'create_ride', details: { rideId: ride._id } });
      console.log('Audit log created successfully');
    } catch (auditError) {
      console.error('Audit log creation failed:', auditError);
      // Don't fail the ride creation if audit log fails
    }
    
    res.status(201).json(ride);
  } catch (err) {
    console.error('createRide error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get ride details
exports.getRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).populate('user', '-password');
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    // Only allow owner or admin to view
    if (ride.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(ride);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all rides of a user with filtering and sorting
exports.getUserRides = async (req, res) => {
  try {
    console.log('getUserRides called with user:', req.user._id);
    console.log('Query params:', req.query);
    
    const { pickup, drop, status, sortBy = 'date', order = 'desc' } = req.query;
    let filter = { user: req.user._id };
    if (pickup) filter.pickup = { $regex: pickup, $options: 'i' };
    if (drop) filter.drop = { $regex: drop, $options: 'i' };
    if (status) filter.status = status;
    const sortOrder = order === 'asc' ? 1 : -1;
    
    console.log('Filter:', filter);
    console.log('Sort:', { [sortBy]: sortOrder });
    
    const rides = await Ride.find(filter).sort({ [sortBy]: sortOrder });
    console.log('Found rides:', rides.length);
    
    res.json(rides);
  } catch (err) {
    console.error('getUserRides error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel a ride
exports.cancelRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (ride.status === 'cancelled') {
      return res.status(400).json({ message: 'Ride already cancelled' });
    }
    ride.status = 'cancelled';
    await ride.save();
    await AuditLog.create({ user: req.user._id, action: 'cancel_ride', details: { rideId: ride._id } });
    res.json({ message: 'Ride cancelled' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};