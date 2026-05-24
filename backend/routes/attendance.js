const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { create, getByRestaurant, update } = require('../controllers/attendanceController');

router.post('/', protect, authorize('owner', 'superadmin'), create);
router.get('/restaurant/:restaurantId', protect, authorize('owner', 'superadmin'), getByRestaurant);
router.put('/:id', protect, authorize('owner', 'superadmin'), update);

module.exports = router;
