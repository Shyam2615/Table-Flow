const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    cuisine: [{ type: String }],
    address: {
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        zipCode: { type: String, default: '' }
    },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    image: { type: String, default: '' },
    images: [{ type: String }],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    openingHours: {
        open: { type: String, default: '09:00' },
        close: { type: String, default: '22:00' }
    },
    tables: [{
        tableNumber: { type: Number, required: true },
        capacity: { type: Number, required: true },
        isAvailable: { type: Boolean, default: true }
    }],
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isApproved: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    priceRange: { type: String, enum: ['$', '$$', '$$$', '$$$$'], default: '$$' }
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);
