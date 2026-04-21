const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Booking = require('../models/Booking');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');

// Get all restaurants (superadmin)
router.get('/restaurants', protect, authorize('superadmin'), async (req, res) => {
    try {
        const restaurants = await Restaurant.find().populate('ownerId', 'name email');
        res.json(restaurants);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Approve/suspend restaurant
router.put('/restaurants/:id', protect, authorize('superadmin'), async (req, res) => {
    try {
        const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
        res.json(restaurant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all owners
router.get('/owners', protect, authorize('superadmin'), async (req, res) => {
    try {
        const owners = await User.find({ role: 'owner' }).select('-password');
        res.json(owners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all users
router.get('/users', protect, authorize('superadmin'), async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update user status
router.put('/users/:id', protect, authorize('superadmin'), async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Platform stats
router.get('/stats', protect, authorize('superadmin'), async (req, res) => {
    try {
        const totalRestaurants = await Restaurant.countDocuments();
        const activeRestaurants = await Restaurant.countDocuments({ isApproved: true, isActive: true });
        const totalUsers = await User.countDocuments();
        const totalOwners = await User.countDocuments({ role: 'owner' });
        const totalBookings = await Booking.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalRevenue = await Order.aggregate([
            { $match: { paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        res.json({
            totalRestaurants, activeRestaurants, totalUsers, totalOwners,
            totalBookings, totalOrders,
            totalRevenue: totalRevenue[0]?.total || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
