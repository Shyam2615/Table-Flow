const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Sync Clerk user with MongoDB (called after sign-in/sign-up)
router.post('/sync', async (req, res) => {
    try {
        const { clerkUserId, name, email, phone, role } = req.body;

        if (!clerkUserId || !email) {
            return res.status(400).json({ message: 'clerkUserId and email are required' });
        }

        // Check if user already exists by clerkUserId
        let user = await User.findOne({ clerkUserId });

        if (user) {
            // Update existing user info
            user.name = name || user.name;
            user.email = email || user.email;
            user.phone = phone || user.phone;
            await user.save();
            return res.json(user);
        }

        // Check if user exists by email (for migrating existing users)
        user = await User.findOne({ email });

        if (user) {
            // Link existing user to Clerk
            user.clerkUserId = clerkUserId;
            user.name = name || user.name;
            user.phone = phone || user.phone;
            await user.save();
            return res.json(user);
        }

        // Create new user
        user = await User.create({
            clerkUserId,
            name: name || 'User',
            email,
            phone: phone || '',
            role: role || 'customer',
            password: '', // No password needed for Clerk users
        });

        res.status(201).json(user);
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get current user
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
