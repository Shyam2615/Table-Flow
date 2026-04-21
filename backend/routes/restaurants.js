const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const { protect, authorize } = require('../middleware/auth');

// Get all restaurants (public)
router.get('/', async (req, res) => {
    try {
        const { cuisine, search, priceRange } = req.query;
        let query = { isApproved: true, isActive: true };
        if (cuisine) query.cuisine = { $in: [cuisine] };
        if (priceRange) query.priceRange = priceRange;
        if (search) query.name = { $regex: search, $options: 'i' };

        const restaurants = await Restaurant.find(query).populate('ownerId', 'name email');
        res.json(restaurants);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get owner's restaurant (MUST be before /:id to avoid matching "owner" as an id)
router.get('/owner/my-restaurant', protect, authorize('owner'), async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
        if (!restaurant) return res.status(404).json({ message: 'No restaurant found' });
        res.json(restaurant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single restaurant (public)
router.get('/:id', async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id).populate('ownerId', 'name email');
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
        res.json(restaurant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create restaurant (owner only)
router.post('/', protect, authorize('owner', 'superadmin'), async (req, res) => {
    try {
        const restaurant = await Restaurant.create({ ...req.body, ownerId: req.user._id });
        await require('../models/User').findByIdAndUpdate(req.user._id, { restaurantId: restaurant._id });
        res.status(201).json(restaurant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update restaurant (owner only)
router.put('/:id', protect, authorize('owner', 'superadmin'), async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
        if (req.user.role !== 'superadmin' && restaurant.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const updated = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete restaurant
router.delete('/:id', protect, authorize('owner', 'superadmin'), async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
        if (req.user.role !== 'superadmin' && restaurant.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        await Restaurant.findByIdAndDelete(req.params.id);
        res.json({ message: 'Restaurant removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get owner's restaurant
router.get('/owner/my-restaurant', protect, authorize('owner'), async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
        if (!restaurant) return res.status(404).json({ message: 'No restaurant found' });
        res.json(restaurant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
