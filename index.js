const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv').config();
const connectDB = require('./config');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes')
const flightRoutes = require('./routes/flightRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

connectDB();

app.use(express.json());
app.use(cors({ origin: '*' }));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payment', paymentRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));