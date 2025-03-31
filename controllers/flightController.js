const axios = require('axios');
const dotenv = require('dotenv').config();
const Flight = require('../models/Flight');

const getLufthansaAccessToken = async () => {
    try {
        if (!process.env.LUFTHANSA_API_KEY || !process.env.LUFTHANSA_API_SECRET) {
            throw new Error('Missing Lufthansa API credentials');
        }

        const formData = new URLSearchParams();
        formData.append("client_id", process.env.LUFTHANSA_API_KEY);
        formData.append("client_secret", process.env.LUFTHANSA_API_SECRET);
        formData.append("grant_type", "client_credentials");

        const response = await axios.post(
            'https://api.lufthansa.com/v1/oauth/token',
            formData,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        return response.data.access_token;
    } catch (err) {
        throw new Error('Failed to get Lufthansa access token');
    }
};

const searchFlights = async (req, res) => {
    try {
        let { origin, destination, date } = req.query;

        if (!origin && !destination) {
            return res.status(400).json({ message: "Missing both origin and destination parameters." });
        }

        if (!date) {
            return res.status(400).json({ message: "Missing required date parameter." });
        }

        const formattedDate = new Date(date);
        if (isNaN(formattedDate.getTime())) {
            return res.status(400).json({ message: "Invalid date format" });
        }

        const formattedDateString = formattedDate.toISOString().split('T')[0];

        const existingFlights = await Flight.find({
            departure: origin,
            destination: destination,
            departureTime: {
                $gte: new Date(formattedDateString), 
                $lt: new Date(new Date(formattedDateString).setDate(new Date(formattedDateString).getDate() + 1)) 
            }
        });

        if (existingFlights.length > 0) {
            return res.json(existingFlights);  
        }

        // If no flights found in the database, fetch from Lufthansa API
        const accessToken = await getLufthansaAccessToken();

        let url = `https://api.lufthansa.com/v1/operations/schedules/${origin}/${destination}/${date}`;

        let response;
        try {
            response = await axios.get(url, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
        } catch (apiError) {
            if (apiError.response?.status === 404) {
                return res.json([]); 
            } else {
                throw apiError;
            }
        }

        const scheduleResource = response.data?.ScheduleResource;
        if (!scheduleResource || !scheduleResource.Schedule) {
            return res.json([]); 
        }

        const schedules = Array.isArray(scheduleResource.Schedule)
            ? scheduleResource.Schedule
            : [scheduleResource.Schedule];

        const flights = schedules.flatMap(schedule => {
            let flightArray = Array.isArray(schedule.Flight) ? schedule.Flight : [schedule.Flight];

            return flightArray
                .filter(flightData =>
                    flightData.Departure?.AirportCode === origin &&
                    flightData.Arrival?.AirportCode === destination
                )
                .map(flightData => {
                    const flightDate = flightData.Departure.ScheduledTimeLocal.DateTime.split('T')[0]; 

                    if (flightDate !== formattedDateString) {
                        return null; 
                    }

                    return {
                        airline: flightData.MarketingCarrier.AirlineID,
                        flightNumber: flightData.MarketingCarrier.FlightNumber,
                        departure: flightData.Departure.AirportCode,
                        departureTime: flightData.Departure.ScheduledTimeLocal.DateTime,
                        destination: flightData.Arrival.AirportCode,
                        arrivalTime: flightData.Arrival.ScheduledTimeLocal.DateTime,
                        price: (Math.random() * 300 + 200).toFixed(2),
                        availableSeats: Math.floor(Math.random() * 100) + 10,
                    };
                })
                .filter(flight => flight !== null); 
        });

        for (let flight of flights) {
            const existingFlight = await Flight.findOne({
                flightNumber: flight.flightNumber,
                departure: flight.departure,
                destination: flight.destination,
                departureTime: flight.departureTime
            });

            if (!existingFlight) {
                const newFlight = new Flight({
                    airline: flight.airline,
                    flightNumber: flight.flightNumber,
                    departure: flight.departure,
                    departureTime: flight.departureTime,
                    destination: flight.destination,
                    arrivalTime: flight.arrivalTime,
                    price: flight.price,
                    availableSeats: flight.availableSeats
                });

                await newFlight.save();
            }
        }

        return res.json(flights.length > 0 ? flights : []); 
    } catch (err) {
        console.error("Error fetching flights:", err.message);
        res.status(500).json({ message: "Error fetching flights from Lufthansa API", error: err.message });
    }
};

module.exports = { searchFlights };
