const { clerkClient } = require('@clerk/express');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Verify the Clerk session token
            const { sub: clerkUserId } = await clerkClient.verifyToken(token);

            // Find the user in MongoDB by clerkUserId
            let user = await User.findOne({ clerkUserId }).select('-password');

            if (!user) {
                // If user doesn't exist yet in MongoDB, try to find by email from Clerk
                const clerkUser = await clerkClient.users.getUser(clerkUserId);
                const email = clerkUser.emailAddresses?.[0]?.emailAddress;

                if (email) {
                    user = await User.findOne({ email }).select('-password');
                    if (user) {
                        // Link existing MongoDB user to Clerk
                        user.clerkUserId = clerkUserId;
                        await user.save();
                    }
                }
            }

            if (!user) {
                return res.status(401).json({ message: 'User not found. Please sync your account first.' });
            }

            req.user = user;
            next();
        } catch (error) {
            console.error('Auth error:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized for this action' });
        }
        next();
    };
};

module.exports = { protect, authorize };
