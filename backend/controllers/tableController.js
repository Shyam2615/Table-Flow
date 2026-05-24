const Restaurant = require('../models/Restaurant');
const Booking = require('../models/Booking');
const Order = require('../models/Order');

// Get all tables for a restaurant with availability status for a specific time
const getTablesByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { date, time } = req.query;
    const restaurant = await Restaurant.findById(restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Get tables with bookings/orders for the specified time
    let bookedTables = [];
    
    if (date && time) {
      const bookings = await Booking.find({
        restaurantId,
        date,
        time,
        status: { $in: ['pending', 'confirmed'] }
      });
      
      const orders = await Order.find({
        restaurantId,
        createdAt: { 
          $gte: new Date(`${date}T${time}`),
          $lte: new Date(`${date}T${time}:59`)
        },
        status: { $in: ['pending', 'preparing', 'ready'] }
      });

      bookedTables = [
        ...bookings.map(b => b.tableNumber),
        ...orders.map(o => o.tableNumber)
      ];
    }

    // Enhance tables with availability status
    const tablesWithStatus = restaurant.tables.map(table => ({
      ...table.toObject ? table.toObject() : table,
      isBooked: bookedTables.includes(table.tableNumber)
    }));

    res.json({
      restaurantId,
      tables: tablesWithStatus,
      bookedTableNumbers: bookedTables
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update table details (owner only)
const updateTable = async (req, res) => {
  try {
    const { restaurantId, tableNumber } = req.params;
    const { tableName, capacity, positionX, positionY } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const tableIndex = restaurant.tables.findIndex(
      t => t.tableNumber === parseInt(tableNumber)
    );

    if (tableIndex === -1) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Update table details
    if (tableName !== undefined) restaurant.tables[tableIndex].tableName = tableName;
    if (capacity !== undefined) restaurant.tables[tableIndex].capacity = capacity;
    if (positionX !== undefined) restaurant.tables[tableIndex].positionX = positionX;
    if (positionY !== undefined) restaurant.tables[tableIndex].positionY = positionY;

    await restaurant.save();
    res.json(restaurant.tables[tableIndex]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Set number of tables (superadmin only)
const setTableCount = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { count } = req.body;

    if (!Number.isInteger(count) || count < 1) {
      return res.status(400).json({ message: 'Count must be a positive integer' });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const currentCount = restaurant.tables.length;

    if (count > currentCount) {
      // Add new tables
      for (let i = currentCount + 1; i <= count; i++) {
        restaurant.tables.push({
          tableNumber: i,
          tableName: `Table ${i}`,
          capacity: 4,
          positionX: 0,
          positionY: 0,
          isAvailable: true
        });
      }
    } else if (count < currentCount) {
      // Remove tables from the end
      restaurant.tables = restaurant.tables.slice(0, count);
    }

    await restaurant.save();
    res.json({
      message: `Restaurant now has ${count} tables`,
      tables: restaurant.tables
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get table availability for a specific date/time range
const getTableAvailability = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { date, startTime, endTime, guests } = req.query;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Get bookings for the date
    const bookings = await Booking.find({
      restaurantId,
      date,
      status: { $in: ['pending', 'confirmed'] }
    });

    // Get orders for the date
    const dateStart = new Date(`${date}T00:00:00`);
    const dateEnd = new Date(`${date}T23:59:59`);
    const orders = await Order.find({
      restaurantId,
      createdAt: { $gte: dateStart, $lte: dateEnd },
      status: { $in: ['pending', 'preparing', 'ready'] }
    });

    // Find available tables that can fit the guests
    const availableTables = restaurant.tables.filter(table => {
      // Check if table has enough capacity
      if (guests && parseInt(guests) > table.capacity) {
        return false;
      }

      // Check if table is booked during the requested time
      const isBookedDuringTime = bookings.some(
        b => b.tableNumber === table.tableNumber && 
             (!startTime || !endTime || (b.time >= startTime && b.time <= endTime))
      );

      // Check if table has active order during the requested time
      const hasActiveOrder = orders.some(o => o.tableNumber === table.tableNumber);

      return !isBookedDuringTime && !hasActiveOrder;
    });

    res.json({
      restaurantId,
      date,
      availableTables,
      totalTables: restaurant.tables.length,
      availableCount: availableTables.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTablesByRestaurant,
  updateTable,
  setTableCount,
  getTableAvailability
};
