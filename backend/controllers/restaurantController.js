const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

const getAll = async (req, res) => {
  try {
    const { cuisine, search, priceRange } = req.query;
    const query = { isApproved: true, isActive: true };
    if (cuisine) query.cuisine = { $in: [cuisine] };
    if (priceRange) query.priceRange = priceRange;
    if (search) query.name = { $regex: search, $options: 'i' };

    const restaurants = await Restaurant.find(query).populate('ownerId', 'name email');
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) return res.status(404).json({ message: 'No restaurant found' });
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate('ownerId', 'name email');
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const restaurant = await Restaurant.create({ ...req.body, ownerId: req.user._id });
    await User.findByIdAndUpdate(req.user._id, { restaurantId: restaurant._id });
    res.status(201).json(restaurant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const update = async (req, res) => {
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
};

const remove = async (req, res) => {
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
};

module.exports = { getAll, getMyRestaurant, getById, create, update, remove };
