const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth } = require('../middleware/auth');

// Register
router.post('/register', userController.registerUser);

// Login
router.post('/login', userController.loginUser);

// Get profile (auth required)
router.get('/me', auth, userController.getProfile);

// Update profile (auth required)
router.put('/me', auth, userController.updateProfile);

// Forgot password
router.post('/forgot-password', userController.forgotPassword);
// Reset password
router.post('/reset-password', userController.resetPassword);
// Deactivate user (soft delete)
router.delete('/me', auth, userController.deactivateUser);

module.exports = router;