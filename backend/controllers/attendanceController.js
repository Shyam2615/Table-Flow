const Attendance = require('../models/Attendance');

const create = async (req, res) => {
  try {
    const attendance = await Attendance.create(req.body);
    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getByRestaurant = async (req, res) => {
  try {
    const { date, employeeId } = req.query;
    const query = { restaurantId: req.params.restaurantId };
    if (date) query.date = date;
    if (employeeId) query.employeeId = employeeId;

    const attendance = await Attendance.find(query)
      .populate('employeeId', 'name position department')
      .sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!attendance) return res.status(404).json({ message: 'Attendance not found' });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { create, getByRestaurant, update };
