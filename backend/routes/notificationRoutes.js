const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');

// Placeholder notification routes - to be implemented
router.get('/', auth, (req, res) => {
  res.json({ message: 'Get notifications - coming soon' });
});

router.post('/', auth, authorize('admin'), (req, res) => {
  res.json({ message: 'Send notification - coming soon' });
});

// These routes must come after specific routes
router.put('/:id/read', auth, (req, res) => {
  res.json({ message: 'Mark notification as read - coming soon' });
});

router.get('/:id', auth, (req, res) => {
  res.json({ message: 'Get notification details - coming soon' });
});

router.delete('/:id', auth, (req, res) => {
  res.json({ message: 'Delete notification - coming soon' });
});

module.exports = router; 