const express = require('express');
const router = express.Router();
const Shift = require('../models/Shift');
const { protect, authorize } = require('../middleware/auth');

// Get shifts for a restaurant
router.get('/restaurant/:restaurantId', protect, authorize('owner', 'superadmin'), async (req, res) => {
    try {
        const shifts = await Shift.find({ restaurantId: req.params.restaurantId })
            .populate('employeeId', 'name position department');
        res.json(shifts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create shift
router.post('/', protect, authorize('owner', 'superadmin'), async (req, res) => {
    try {
        const shift = await Shift.create(req.body);
        res.status(201).json(shift);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update shift
router.put('/:id', protect, authorize('owner', 'superadmin'), async (req, res) => {
    try {
        const shift = await Shift.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!shift) return res.status(404).json({ message: 'Shift not found' });
        res.json(shift);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete shift
router.delete('/:id', protect, authorize('owner', 'superadmin'), async (req, res) => {
    try {
        await Shift.findByIdAndDelete(req.params.id);
        res.json({ message: 'Shift removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
