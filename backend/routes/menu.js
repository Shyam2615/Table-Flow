const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const { protect, authorize } = require('../middleware/auth');

// Get menu items for a restaurant (public)
router.get('/restaurant/:restaurantId', async (req, res) => {
    try {
        const items = await MenuItem.find({ restaurantId: req.params.restaurantId });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add menu item (owner)
router.post('/', protect, authorize('owner', 'superadmin'), async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
        if (!restaurant && req.user.role !== 'superadmin') {
            return res.status(404).json({ message: 'No restaurant found for this owner' });
        }
        const restaurantId = req.body.restaurantId || restaurant._id;
        const item = await MenuItem.create({ ...req.body, restaurantId });
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update menu item
router.put('/:id', protect, authorize('owner', 'superadmin'), async (req, res) => {
    try {
        const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ message: 'Menu item not found' });
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete menu item
router.delete('/:id', protect, authorize('owner', 'superadmin'), async (req, res) => {
    try {
        const item = await MenuItem.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ message: 'Menu item not found' });
        res.json({ message: 'Menu item removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
