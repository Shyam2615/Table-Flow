const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');

// Create order (customer)
router.post('/', protect, async (req, res) => {
    try {
        const { restaurantId, items, tableNumber, notes } = req.body;
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const order = await Order.create({
            userId: req.user._id, restaurantId, items, tableNumber, total, notes
        });
        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get my orders (customer)
router.get('/my-orders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id })
            .populate('restaurantId', 'name image')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get orders for a restaurant (owner)
router.get('/restaurant/:restaurantId', protect, authorize('owner', 'superadmin'), async (req, res) => {
    try {
        const orders = await Order.find({ restaurantId: req.params.restaurantId })
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update order status (owner)
router.put('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
