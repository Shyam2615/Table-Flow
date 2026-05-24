const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { create, getMyOrders, getByRestaurant, update } = require('../controllers/orderController');

router.post('/', protect, create);
router.get('/my-orders', protect, getMyOrders);
router.get('/restaurant/:restaurantId', protect, authorize('owner', 'superadmin', 'waiter'), getByRestaurant);
router.put('/:id', protect, update);

module.exports = router;
