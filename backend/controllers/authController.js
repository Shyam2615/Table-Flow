const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

// POST /api/auth/login — email/password sign-in
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        restaurantId: user.restaurantId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/register — email/password registration
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({ name, email, password, phone: phone || '' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/sync — Clerk OAuth user sync
const sync = async (req, res) => {
  try {
    const { clerkUserId, name, email, phone, role } = req.body;
    if (!clerkUserId || !email) {
      return res.status(400).json({ message: 'clerkUserId and email are required' });
    }

    let user = await User.findOne({ clerkUserId });
    if (user) {
      user.name = name || user.name;
      user.email = email || user.email;
      user.phone = phone || user.phone;
      await user.save();
      return res.json(user);
    }

    user = await User.findOne({ email });
    if (user) {
      user.clerkUserId = clerkUserId;
      user.name = name || user.name;
      user.phone = phone || user.phone;
      await user.save();
      return res.json(user);
    }

    user = await User.create({
      clerkUserId,
      name: name || 'User',
      email,
      phone: phone || '',
      role: role || 'customer',
      password: '',
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/me — get current user
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/register-waiter — owner creates a waiter account
const registerWaiter = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'No restaurant found for this owner' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    const user = await User.create({
      name, email, password, phone: phone || '',
      role: 'waiter', restaurantId: restaurant._id,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      restaurantId: user.restaurantId,
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Register waiter error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/waiters — list waiters for the owner's restaurant
const getWaiters = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'No restaurant found for this owner' });
    }

    const waiters = await User.find({
      restaurantId: restaurant._id,
      role: 'waiter',
    }).select('-password').sort({ createdAt: -1 });

    res.json(waiters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/auth/waiters/:id/toggle — activate/deactivate a waiter
const toggleWaiterStatus = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) return res.status(404).json({ message: 'No restaurant found' });

    const waiter = await User.findOne({ _id: req.params.id, restaurantId: restaurant._id, role: 'waiter' });
    if (!waiter) return res.status(404).json({ message: 'Waiter not found' });

    waiter.isActive = !waiter.isActive;
    await waiter.save();

    res.json({ _id: waiter._id, isActive: waiter.isActive });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { login, register, sync, getMe, registerWaiter, getWaiters, toggleWaiterStatus };
