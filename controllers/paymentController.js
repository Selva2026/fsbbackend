const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');

const createCheckoutSession = async (req, res) => {
  const { bookingId } = req.body;

  try {
    const booking = await Booking.findById(bookingId).populate('flightId');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const priceInCents = Math.round(booking.totalPrice * 100);

    // Construct query params for success URL
    const queryParams = new URLSearchParams({
      bookingId: booking._id.toString(),
      status: 'confirmed',
      flightName: booking.flightId.name,  // Example: Flight name
      departure: booking.flightId.departure,  // Example: Departure location
      arrival: booking.flightId.arrival,  // Example: Arrival location
      date: booking.flightId.date,  // Example: Flight date
      price: booking.totalPrice.toString(), // Example: Booking price
    }).toString();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Booking ID: ${bookingId}`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `https://fsbskyradar.netlify.app/payment-success?${queryParams}`,
      cancel_url: `https://fsbskyradar.netlify.app/payment`,
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { createCheckoutSession };
