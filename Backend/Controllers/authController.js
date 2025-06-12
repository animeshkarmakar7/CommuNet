const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../Models/user');


exports.getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id; // This is correct
    const users = await User.find({ _id: { $ne: currentUserId } }).select('name status avatar');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};
exports.register = async (req, res) => {
  try {
    console.log("Register request body:", req.body);

    const { name, email, password, mobile, dob } = req.body;

    // Validation - return early if invalid
    if (!name || !email || !password || !mobile || !dob) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user exists - return early if exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      name, 
      email, 
      password: hashedPassword,
      mobile,
      dob
    });

    await user.save();

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { 
      expiresIn: '1d' 
    });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    // Send single response
    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile
      },
      token
    });

  } catch (err) {
    console.error("Register error:", err);
    
    // Ensure only one error response is sent
    if (!res.headersSent) {
      return res.status(500).json({ 
        message: err.message || 'Registration failed' 
      });
    }
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('-password'); // Exclude password
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Need to find user again with password for verification
    const userWithPassword = await User.findOne({ email });
    const isMatch = await bcrypt.compare(password, userWithPassword.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    // Return necessary data
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
        // Add other fields you need in frontend
      },
      token // Include token in response if needed
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ user });
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};
exports.logout = (req, res) => {
  try {
    // Clear the cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict'
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};