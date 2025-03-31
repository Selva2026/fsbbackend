const express = require('express');
const router = express.Router();
const { createBooking, getUserBookings, updateBookingStatus} = require('../controllers/bookingController');

router.post('/create', createBooking);

router.get('/user/:userId', getUserBookings);

router.put('/status', updateBookingStatus);

module.exports = router;
