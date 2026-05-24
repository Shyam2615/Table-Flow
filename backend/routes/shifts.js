const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getByRestaurant, create, update, remove } = require('../controllers/shiftController');

router.get('/restaurant/:restaurantId', protect, authorize('owner', 'superadmin'), getByRestaurant);
router.post('/', protect, authorize('owner', 'superadmin'), create);
router.put('/:id', protect, authorize('owner', 'superadmin'), update);
router.delete('/:id', protect, authorize('owner', 'superadmin'), remove);

module.exports = router;
