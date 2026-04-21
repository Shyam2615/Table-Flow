const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    date: { type: String, required: true },
    checkIn: { type: String, default: '' },
    checkOut: { type: String, default: '' },
    status: { type: String, enum: ['present', 'absent', 'half-day', 'late'], default: 'present' },
    hoursWorked: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
