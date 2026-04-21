const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    role: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Shift', shiftSchema);
