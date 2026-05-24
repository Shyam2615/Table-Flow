const jwt = require('jsonwebtoken');
const { clerkClient } = require('@clerk/express');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  const token = header.split(' ')[1];

  try {
    // Try Clerk session token first
    const { sub: clerkUserId } = await clerkClient.verifyToken(token);
    let user = await User.findOne({ clerkUserId }).select('-password');

    if (!user) {
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      const email = clerkUser.emailAddresses?.[0]?.emailAddress;
      if (email) {
        user = await User.findOne({ email }).select('-password');
        if (user) {
          user.clerkUserId = clerkUserId;
          await user.save();
        }
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'User not found. Please sync your account first.' });
    }

    req.user = user;
    return next();
  } catch (_clerkError) {
    // Clerk verification failed — fall back to JWT (email/password auth)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      req.user = user;
      return next();
    } catch (_jwtError) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
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
