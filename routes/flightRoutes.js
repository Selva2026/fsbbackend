const express = require('express');
const Flight = require('../models/Flight');
const { searchFlights } = require('../controllers/flightController');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const flights = await Flight.find();
        res.json(flights);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching flights', error: error.message });
    }
});

router.get('/search', searchFlights);

module.exports = router;