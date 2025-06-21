const express = require('express');
const router = express.Router();
const { login, register, getProfile,updateProfile ,  logout } = require('../Controllers/authController');
const auth = require('../middleware/auth');
const User = require('../Models/user'); 

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
// Add this line to your auth routes
router.put('/profile', auth, updateProfile);

// User Search
router.get('/search', auth, async (req, res) => {
  const { name } = req.query;

  if (!name || name.trim() === "") {
    return res.status(400).json({ message: "Search term required" });
  }

  try {
    const users = await User.find({
      _id: { $ne: req.user.id },
      $or: [
        { name: { $regex: name, $options: "i" } },
        { email: { $regex: name, $options: "i" } },
      ],
    }).select("-password");

    res.status(200).json(users);
  } catch (err) {
    console.error("Error in /search route:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// FIX: Use getProfile controller function
router.get('/me', auth, getProfile);

router.get('/users', auth, async (req, res) => {
  try {
    console.log('Auth user object:', req.user);
    
    const users = await User.find({ _id: { $ne: req.user.id } }).select('-password');
    
    console.log('Found users count:', users.length);
    res.json(users);
  } catch (err) {
    console.error('Error in /users route:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;




