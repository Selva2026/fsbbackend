const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    flightId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Flight', 
        required: true 
    },
    numberOfSeats: { 
        type: Number, 
        required: true 
    },
    totalPrice: { 
        type: Number, 
        required: true 
    },
    bookingDate: { 
        type: Date, 
        default: Date.now 
    },
    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'cancelled'], 
        default: 'pending' 
    },
});

bookingSchema.pre('findOne', function() {
    this.populate('flightId');
});
bookingSchema.pre('find', function() {
    this.populate('flightId');
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
