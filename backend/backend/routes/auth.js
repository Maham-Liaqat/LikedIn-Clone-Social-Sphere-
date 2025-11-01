const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// Helper function to check database connection
const checkDBConnection = () => {
  const isConnected = mongoose.connection.readyState === 1; // 1 = connected
  if (!isConnected) {
    throw new Error('Database connection unavailable. Please try again in a moment.');
  }
  return true;
};

// Signup with database connection checking
router.post('/signup', async (req, res) => {
  try {
    console.log('Signup request:', req.body);
    
    // Check database connection first
    checkDBConnection();
    
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Name, email, and password are required' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate username from email
    const baseUsername = email.split('@')[0].toLowerCase();
    let username = baseUsername;
    let counter = 1;
    
    // Ensure unique username
    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Create user
    const user = new User({ 
      name, 
      email, 
      username,
      password 
    });
    
    await user.save();
    console.log('User created:', user._id);

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'fallback-secret-key');

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle database connection errors specifically
    if (error.message.includes('Database connection unavailable') || error.name.includes('Mongo')) {
      return res.status(503).json({ 
        message: 'Database temporarily unavailable',
        error: 'Please try again in a moment'
      });
    }
    
    res.status(500).json({ 
      message: 'Server error during registration',
      error: error.message 
    });
  }
});

// Login with database connection checking
router.post('/login', async (req, res) => {
  try {
    console.log('Login request:', req.body);
    
    // Check database connection first
    checkDBConnection();
    
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.correctPassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'fallback-secret-key');

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle database connection errors specifically
    if (error.message.includes('Database connection unavailable') || error.name.includes('Mongo')) {
      return res.status(503).json({ 
        message: 'Database temporarily unavailable',
        error: 'Please try again in a moment'
      });
    }
    
    res.status(500).json({ 
      message: 'Server error during login',
      error: error.message 
    });
  }
});

// Get current user with connection checking
router.get('/me', auth, async (req, res) => {
  try {
    // Check database connection first
    checkDBConnection();
    
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    
    // Handle database connection errors specifically
    if (error.message.includes('Database connection unavailable') || error.name.includes('Mongo')) {
      return res.status(503).json({ 
        message: 'Database temporarily unavailable',
        error: 'Please try again in a moment'
      });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// Test route that shows database status
router.get('/test', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMessages = {
    0: 'disconnected',
    1: 'connected', 
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({ 
    message: 'Auth routes are working!',
    database: {
      status: statusMessages[dbStatus] || 'unknown',
      connected: dbStatus === 1
    }
  });
});

// Database status route
router.get('/db-status', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMessages = {
    0: 'disconnected',
    1: 'connected', 
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({
    database: {
      status: statusMessages[dbStatus] || 'unknown',
      connected: dbStatus === 1,
      readyState: dbStatus
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;