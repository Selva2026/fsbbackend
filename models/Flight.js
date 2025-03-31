const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
    airline: String,
    flightNumber: String,
    departure: String,
    departureTime: Date,
    destination: String,
    arrivalTime: Date,
    price: Number,
    availableSeats: Number
});

module.exports = mongoose.model('Flight', flightSchema);