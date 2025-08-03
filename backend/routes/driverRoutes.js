const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');

// Placeholder driver routes - to be implemented
router.get('/', auth, authorize('admin'), (req, res) => {
  res.json({ message: 'Driver routes - coming soon' });
});

router.post('/', auth, authorize('admin'), (req, res) => {
  res.json({ message: 'Create driver - coming soon' });
});

router.get('/:id', auth, authorize('admin'), (req, res) => {
  res.json({ message: 'Get driver details - coming soon' });
});

router.put('/:id', auth, authorize('admin'), (req, res) => {
  res.json({ message: 'Update driver - coming soon' });
});

router.delete('/:id', auth, authorize('admin'), (req, res) => {
  res.json({ message: 'Delete driver - coming soon' });
});

module.exports = router; 