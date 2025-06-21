const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../Models/user');

exports.getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const users = await User.find({ _id: { $ne: currentUserId } }).select('name status avatar');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

exports.register = async (req, res) => {
  try {
    console.log("Register request body:", req.body);

    const { name, email, password, mobile} = req.body;

    if (!name || !email || !password || !mobile ) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      name, 
      email, 
      password: hashedPassword,
      mobile
     
    });

    await user.save();

    // FIX: Use consistent payload structure
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { 
      expiresIn: '1d' 
    });

    // FIX: Use consistent cookie name 'jwt'
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 24 * 60 * 60 * 1000
    });

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
    
    if (!res.headersSent) {
      return res.status(500).json({ 
        message: err.message || 'Registration failed' 
      });
    }
  }
};

// Add this method to your authController.js

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { profilePic, name } = req.body;

    // Validate input
    if (!profilePic && !name) {
      return res.status(400).json({ message: 'At least one field is required to update' });
    }

    // Build update object
    const updateData = {};
    if (profilePic) updateData.profilePic = profilePic;
    if (name) updateData.name = name;

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // FIX: Use consistent payload structure
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // FIX: Use consistent cookie name 'jwt'
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    // FIX: Use consistent cookie name 'jwt'
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ message: 'No token provided' });

    // FIX: Use consistent payload structure
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ user });
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

exports.logout = (req, res) => {
  try {
    res.cookie("jwt","",{maxAge:0})
  res.status(200).json({message: "Logged out Successfully"})
  } catch (error) {
    console.log("Error in logout controller",error.messages);
    res.status(500).json({message: "Internal Server error"})
    
  }
};
