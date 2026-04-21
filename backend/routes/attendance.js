const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const { protect, authorize } = require('../middleware/auth');

// Mark attendance
router.post('/', protect, authorize('owner', 'superadmin'), async (req, res) => {
    try {
        const attendance = await Attendance.create(req.body);
        res.status(201).json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get attendance for a restaurant
router.get('/restaurant/:restaurantId', protect, authorize('owner', 'superadmin'), async (req, res) => {
    try {
        const { date, employeeId } = req.query;
        let query = { restaurantId: req.params.restaurantId };
        if (date) query.date = date;
        if (employeeId) query.employeeId = employeeId;

        const attendance = await Attendance.find(query)
            .populate('employeeId', 'name position department')
            .sort({ date: -1 });
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update attendance
router.put('/:id', protect, authorize('owner', 'superadmin'), async (req, res) => {
    try {
        const attendance = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!attendance) return res.status(404).json({ message: 'Attendance not found' });
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
