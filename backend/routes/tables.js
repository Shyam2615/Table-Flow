const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getTablesByRestaurant,
  updateTable,
  setTableCount,
  getTableAvailability
} = require('../controllers/tableController');

// Get all tables for a restaurant with availability info
router.get('/restaurant/:restaurantId', getTablesByRestaurant);

// Get table availability for booking/order
router.get('/availability/:restaurantId', getTableAvailability);

// Update table details (owner only)
router.put('/:restaurantId/:tableNumber', protect, authorize('owner', 'superadmin'), updateTable);

// Set number of tables for a restaurant (superadmin only)
router.post('/:restaurantId/set-count', protect, authorize('superadmin'), setTableCount);

module.exports = router;
