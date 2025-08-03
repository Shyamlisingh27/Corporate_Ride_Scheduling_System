const Ride = require('../models/Ride');
const AdminAction = require('../models/AdminAction');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// View all rides with filters and sorting
// exports.getAllRides = async (req, res) => {
//   try {
//     const { date, status, user, pickup, drop, sortBy = 'date', order = 'desc' } = req.query;
//     let filter = {};
//     if (date) {
//       const start = new Date(date);
//       const end = new Date(date);
//       end.setHours(23, 59, 59, 999);
//       filter.date = { $gte: start, $lte: end };
//     }
//     if (status) filter.status = status;
//     if (user) filter.user = user;
//     if (pickup) filter.pickup = { $regex: pickup, $options: 'i' };
//     if (drop) filter.drop = { $regex: drop, $options: 'i' };
//     const sortOrder = order === 'asc' ? 1 : -1;
//     const rides = await Ride.find(filter)
//       .populate('user', '-password')
//       .populate('adminAction')
//       .sort({ [sortBy]: sortOrder });
//     res.json(rides);
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// const Ride = require('../models/Ride');
// const User = require('../models/User');
// const AdminAction = require('../models/AdminAction');

exports.getAllRides = async (req, res) => {
  try {
    console.log(`📥 getAllRides called by: ${req.user?.email}`);

    const {
      date,
      status,
      user,     // user ID
      pickup,
      drop,
      sortBy = 'date',
      order = 'desc'
    } = req.query;

    const filter = {};

    // 📅 Filter by date
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    // ✅ Filter by status
    if (status) filter.status = status;

    // 👤 Filter by user ID
    if (user) filter.user = user;

    // 📍 Pickup location (partial match)
    if (pickup) filter.pickup = { $regex: pickup, $options: 'i' };

    // 📍 Drop location (partial match)
    if (drop) filter.drop = { $regex: drop, $options: 'i' };

    // ⬆️ Sorting order
    const sortOrder = order === 'asc' ? 1 : -1;

    // 📦 Query the rides
    const rides = await Ride.find(filter)
      .populate({ path: 'user', select: 'name email role' })           // populate user
      .populate({ path: 'adminAction', select: 'action reason admin' }) // populate adminAction
      .sort({ [sortBy]: sortOrder });

    res.status(200).json(rides);
  } catch (err) {
    console.error("❌ Error in getAllRides:", err.message);
    res.status(500).json({ message: 'Server error while fetching rides.' });
  }
};


// Approve a ride
exports.approveRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.status !== 'pending') {
      return res.status(400).json({ message: 'Ride is not pending' });
    }
    ride.status = 'approved';
    const action = new AdminAction({
      ride: ride._id,
      admin: req.user._id,
      action: 'approve',
    });
    await action.save();
    ride.adminAction = action._id;
    await ride.save();
    await AuditLog.create({ user: req.user._id, action: 'approve_ride', details: { rideId: ride._id } });
    res.json({ message: 'Ride approved' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject a ride
exports.rejectRide = async (req, res) => {
  try {
    const { reason } = req.body;
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.status !== 'pending') {
      return res.status(400).json({ message: 'Ride is not pending' });
    }
    ride.status = 'rejected';
    const action = new AdminAction({
      ride: ride._id,
      admin: req.user._id,
      action: 'reject',
      reason,
    });
    await action.save();
    ride.adminAction = action._id;
    await ride.save();
    await AuditLog.create({ user: req.user._id, action: 'reject_ride', details: { rideId: ride._id, reason } });
    res.json({ message: 'Ride rejected' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Ride analytics (e.g., rides per day)
exports.getAnalytics = async (req, res) => {
  try {
    // Rides per day for the last 7 days
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 6);
    const analytics = await Ride.aggregate([
      {
        $match: {
          date: { $gte: lastWeek, $lte: today }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};