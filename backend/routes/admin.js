const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getRestaurants, updateRestaurant, createRestaurant, getOwners, getUsers, createUser, updateUser, deleteUser, getStats,
} = require('../controllers/adminController');

router.get('/restaurants', protect, authorize('superadmin'), getRestaurants);
router.post('/restaurants', protect, authorize('superadmin'), createRestaurant);
router.put('/restaurants/:id', protect, authorize('superadmin'), updateRestaurant);
router.get('/owners', protect, authorize('superadmin'), getOwners);
router.get('/users', protect, authorize('superadmin'), getUsers);
router.post('/users', protect, authorize('superadmin'), createUser);
router.put('/users/:id', protect, authorize('superadmin'), updateUser);
router.delete('/users/:id', protect, authorize('superadmin'), deleteUser);
router.get('/stats', protect, authorize('superadmin'), getStats);

module.exports = router;
