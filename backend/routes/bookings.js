const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { create, getMyBookings, getByRestaurant, update, cancel } = require('../controllers/bookingController');

router.post('/', protect, create);
router.get('/my-bookings', protect, getMyBookings);
router.get('/restaurant/:restaurantId', protect, authorize('owner', 'superadmin'), getByRestaurant);
router.put('/:id', protect, update);
router.put('/:id/cancel', protect, cancel);

module.exports = router;
