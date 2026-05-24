const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAll, getMyRestaurant, getById, create, update, remove,
} = require('../controllers/restaurantController');

router.get('/', getAll);
router.get('/owner/my-restaurant', protect, authorize('owner'), getMyRestaurant);
router.get('/:id', getById);
router.post('/', protect, authorize('owner', 'superadmin'), create);
router.put('/:id', protect, authorize('owner', 'superadmin'), update);
router.delete('/:id', protect, authorize('owner', 'superadmin'), remove);

module.exports = router;
