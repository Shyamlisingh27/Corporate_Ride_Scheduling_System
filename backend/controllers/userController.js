const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const AuditLog = require('../models/AuditLog');

// Register a new user
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    user = new User({ name, email, password });
    await user.save();
    
    // Include the lastPasswordChange timestamp in the token for accurate comparison
    const token = jwt.sign({ 
      id: user._id,
      pwdChangedAt: user.lastPasswordChange ? user.lastPasswordChange.getTime() / 1000 : null
    }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }
    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(400).json({ message: 'Invalid credentials or inactive user' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Include the lastPasswordChange timestamp in the token for accurate comparison
    const token = jwt.sign({ 
      id: user._id,
      pwdChangedAt: user.lastPasswordChange ? user.lastPasswordChange.getTime() / 1000 : null
    }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  if (!req.user.isActive) return res.status(401).json({ message: 'User is inactive' });
  res.json(req.user);
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) {
      user.password = password;
    }
    await user.save();
    await AuditLog.create({ user: req.user._id, action: 'update_profile', details: { name, email } });
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });
  const token = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();
  res.json({ message: 'Password reset token generated', token });
};

// Reset password
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  res.json({ message: 'Password has been reset' });
};

// Deactivate user (soft delete)
exports.deactivateUser = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.isActive = false;
  await user.save();
  await AuditLog.create({ user: req.user._id, action: 'deactivate_user', details: {} });
  res.json({ message: 'User deactivated' });
};