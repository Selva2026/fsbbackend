const User = require('../models/User');
const bcrypt = require('bcrypt'); 

const getUserProfile = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.username = req.body.username || user.username;
        
        if (req.body.password) {
            user.password = await bcrypt.hash(req.body.password, 10);
        }
        
        await user.save();
        
        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { getUserProfile, updateUserProfile };
