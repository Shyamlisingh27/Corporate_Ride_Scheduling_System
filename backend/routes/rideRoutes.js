const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const { auth } = require('../middleware/auth');

// Create a new ride request
router.post('/', auth, rideController.createRide);

// Get ride details
router.get('/:id', auth, rideController.getRide);

// Get all rides of a user
router.get('/', auth, rideController.getUserRides);

// Cancel a ride
router.delete('/:id', auth, rideController.cancelRide);

module.exports = router;