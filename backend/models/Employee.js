const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    position: { type: String, required: true },
    department: { type: String, enum: ['kitchen', 'service', 'management', 'cleaning', 'security'], default: 'service' },
    salary: { type: Number, required: true },
    joinDate: { type: Date, default: Date.now },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    status: { type: String, enum: ['active', 'inactive', 'on-leave'], default: 'active' },
    address: { type: String, default: '' },
    emergencyContact: { type: String, default: '' },
    bankDetails: {
        accountNumber: { type: String, default: '' },
        bankName: { type: String, default: '' },
        ifscCode: { type: String, default: '' }
    }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
