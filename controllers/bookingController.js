
const mongoose = require("mongoose");
const Booking = require('../models/Booking');
const Flight = require('../models/Flight');
const User = require('../models/User');
const nodemailer = require('nodemailer');
require("dotenv").config();

const createBooking = async (req, res) => {
    try {
        const { userId, flightId, numberOfSeats } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid userId" });
        }
        
        if (!mongoose.Types.ObjectId.isValid(flightId)) {
            return res.status(400).json({ message: "Invalid flightId" });
        }

        // Check if the flight exists
        const flight = await Flight.findById(flightId);
        if (!flight) {
            return res.status(404).json({ message: "Flight not found" });
        }

        // Check if enough seats are available
        if (flight.availableSeats < numberOfSeats) {
            return res.status(400).json({ message: "Not enough available seats" });
        }

        const totalPrice = (flight.price * numberOfSeats).toFixed(2);

        // Create the booking
        const booking = new Booking({
            userId,
            flightId,
            numberOfSeats,
            totalPrice,
            status: 'pending',
        });

        await booking.save();

        await flight.save();

        return res.status(201).json(booking);
    } catch (err) {
        console.error("Error creating booking:", err.message);
        res.status(500).json({ message: "Error creating booking", error: err.message });
    }
};

const getUserBookings = async (req, res) => {
    try {
        const { userId } = req.params;
        const bookings = await Booking.find({ userId }).sort({ bookingDate: -1 }).populate("flightId");
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: "Error fetching bookings", error });
    }
};


const updateBookingStatus = async (req, res) => {
    try {
        const { bookingId, status } = req.body;
        const validStatuses = ["pending", "confirmed", "cancelled"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const booking = await Booking.findById(bookingId).populate("userId").populate("flightId");
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status === status) {
            return res.status(400).json({ message: "Booking is already in this status" });
        }

        const user = await User.findById(booking.userId);
        const flight = booking.flightId;
        if (!flight) {
            return res.status(404).json({ message: "Associated flight not found" });
        }

        if (status === "confirmed") {
            if (flight.availableSeats < booking.numberOfSeats) {
                return res.status(400).json({ message: "Not enough available seats on this flight" });
            }

            flight.availableSeats -= booking.numberOfSeats;
            booking.status = status;

            await flight.save();
            await booking.save();

            setTimeout(async () => {
                await sendBookingConfirmationEmail(user, flight, booking);
            }, 2000); 
        }

        if (status === "cancelled") {
            flight.availableSeats += booking.numberOfSeats;
            booking.status = status;
            
            await flight.save();
            await booking.save();
        }

        return res.status(200).json({ message: "Booking status updated successfully", booking });
    } catch (err) {
        res.status(500).json({ message: "Error updating booking status", error: err.message });
    }
};


const sendBookingConfirmationEmail = async (user, flight, booking) => {
    try {
        const userName = user.username || user.email;
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: "Your Flight Booking Confirmation",
            text: `
                Dear ${userName},

                Your flight booking has been confirmed! Here are your flight details:

                Flight Number: ${flight.flightNumber}
                Airline: ${flight.airline}
                Departure: ${flight.departure}
                Destination: ${flight.destination}
                Date: ${new Date(flight.departureTime).toLocaleDateString()}
                Departure Time: ${new Date(flight.departureTime).toLocaleTimeString()}
                Total Price: $${booking.totalPrice}
                Seats Booked: ${booking.numberOfSeats}

                Thank you for choosing our airline. Have a safe journey!

                Best regards,
                Skypiea Airlines Team
            `,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending email:", error);
    }
};


module.exports = {
    createBooking,
    getUserBookings,
    updateBookingStatus
};
