const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth } = require('../middleware/auth');
const admin = require('../middleware/admin');

// View all rides (with filters)
router.get('/rides', auth, admin, adminController.getAllRides);

// Approve a ride
router.post('/rides/:id/approve', auth, admin, adminController.approveRide);

// Reject a ride
router.post('/rides/:id/reject', auth, admin, adminController.rejectRide);

// Ride analytics
router.get('/analytics', auth, admin, adminController.getAnalytics);

module.exports = router;