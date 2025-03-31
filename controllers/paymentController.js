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
      success_url: `${process.env.CLIENT_URL}/payment-success?bookingId=${bookingId}`,
      cancel_url: `${process.env.CLIENT_URL}/payment`,
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { createCheckoutSession };
