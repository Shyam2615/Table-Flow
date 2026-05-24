const Leave = require('../models/Leave');

const create = async (req, res) => {
  try {
    const leave = await Leave.create(req.body);
    res.status(201).json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getByRestaurant = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { restaurantId: req.params.restaurantId };
    if (status) query.status = status;

    const leaves = await Leave.find(query)
      .populate('employeeId', 'name position department')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { ...req.body, approvedBy: req.user._id },
      { new: true }
    );
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    res.json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { create, getByRestaurant, update };
