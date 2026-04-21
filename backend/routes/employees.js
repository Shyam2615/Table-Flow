const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { protect, authorize } = require('../middleware/auth');

// Get all employees for a restaurant
router.get('/restaurant/:restaurantId', protect, authorize('owner', 'superadmin'), async (req, res) => {
    try {
        const employees = await Employee.find({ restaurantId: req.params.restaurantId });
        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add employee
router.post('/', protect, authorize('owner', 'superadmin'), async (req, res) => {
    try {
        const employee = await Employee.create(req.body);
        res.status(201).json(employee);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update employee
router.put('/:id', protect, authorize('owner', 'superadmin'), async (req, res) => {
    try {
        const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
        res.json(employee);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete employee
router.delete('/:id', protect, authorize('owner', 'superadmin'), async (req, res) => {
    try {
        await Employee.findByIdAndDelete(req.params.id);
        res.json({ message: 'Employee removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
