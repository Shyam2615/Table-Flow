const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Restaurant = require('../models/Restaurant');
const { protect, authorize } = require('../middleware/auth');

// Create booking (customer)
router.post('/', protect, async (req, res) => {
    try {
        const { restaurantId, tableNumber, date, time, guests, specialRequests } = req.body;
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

        // Check if table is available for the requested date/time
        const existingBooking = await Booking.findOne({
            restaurantId, tableNumber, date, time,
            status: { $in: ['pending', 'confirmed'] }
        });
        if (existingBooking) return res.status(400).json({ message: 'Table already booked for this slot' });

        const booking = await Booking.create({
            userId: req.user._id, restaurantId, tableNumber, date, time, guests, specialRequests
        });
        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get my bookings (customer)
router.get('/my-bookings', protect, async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user._id })
            .populate('restaurantId', 'name address image')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get bookings for a restaurant (owner)
router.get('/restaurant/:restaurantId', protect, authorize('owner', 'superadmin'), async (req, res) => {
    try {
        const bookings = await Booking.find({ restaurantId: req.params.restaurantId })
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update booking status (owner)
router.put('/:id', protect, async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Cancel booking
router.put('/:id/cancel', protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        booking.status = 'cancelled';
        await booking.save();
        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
