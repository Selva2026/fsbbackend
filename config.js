const mongoose = require('mongoose');
const dotenv = require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB);
        console.log('MongoDB Connected');
    } catch (err) {
        process.exit(1);
    }
};

module.exports = connectDB;