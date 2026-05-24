const Booking = require('../models/Booking');
const Restaurant = require('../models/Restaurant');

const create = async (req, res) => {
  try {
    const { restaurantId, tableNumber, date, time, guests, specialRequests } = req.body;
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const existingBooking = await Booking.findOne({
      restaurantId, tableNumber, date, time,
      status: { $in: ['pending', 'confirmed'] },
    });
    if (existingBooking) return res.status(400).json({ message: 'Table already booked for this slot' });

    const booking = await Booking.create({
      userId: req.user._id, restaurantId, tableNumber, date, time, guests, specialRequests,
    });
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('restaurantId', 'name address image')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getByRestaurant = async (req, res) => {
  try {
    const { date, page = 1, limit = 20 } = req.query;
    const filter = { restaurantId: req.params.restaurantId };
    if (date) filter.date = date;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('userId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Booking.countDocuments(filter),
    ]);

    res.json({
      bookings,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancel = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    booking.status = 'cancelled';
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { create, getMyBookings, getByRestaurant, update, cancel };
