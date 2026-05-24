const express = require('express');
const router = express.Router();
const { login, register, sync, getMe, registerWaiter, getWaiters, toggleWaiterStatus } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', register);
router.post('/sync', sync);
router.get('/me', protect, getMe);
router.post('/register-waiter', protect, authorize('owner'), registerWaiter);
router.get('/waiters', protect, authorize('owner'), getWaiters);
router.put('/waiters/:id/toggle', protect, authorize('owner'), toggleWaiterStatus);

module.exports = router;
