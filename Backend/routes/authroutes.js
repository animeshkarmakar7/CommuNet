const express = require('express');
const router = express.Router();
const { login, register } = require('../Controllers/authController');
const auth = require('../middleware/auth');
const User = require('../Models/user'); 

router.post('/register', register);
router.post('/login', login);

// ✅ New route to get user info (needed for AuthContext)
router.get('/me', auth, (req, res) => {
  res.json({ user: req.user, token: req.token });
});

router.get('/users', auth, async (req, res) => {
  try {
    console.log('Auth user object:', req.user); // Debug log
    
    // Use req.user.id instead of req.user._id
    const users = await User.find({ _id: { $ne: req.user.id } }).select('-password');
    
    console.log('Found users count:', users.length); // Debug log
    res.json(users);
  } catch (err) {
    console.error('Error in /users route:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;


