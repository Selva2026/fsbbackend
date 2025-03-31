const express = require('express');
const { forgotPassword, resetPassword } = require('../controllers/passwordController');
const router = express.Router();

router.post('/forgot', forgotPassword);
router.post('/reset/:id/:token', resetPassword);

module.exports = router;