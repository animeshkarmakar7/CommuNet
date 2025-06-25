require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authroutes');
const messageRoutes = require('./routes/messageroutes');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { app, server } = require('./lib/socket');
const path = require('path');

const PORT = process.env.PORT;

const originalAppUse = app.use.bind(app);

app.use = function (path, ...handlers) {
  if (typeof path === 'string') {
    console.log('🛠 app.use path:', path);  // Log all routes being registered
    if (path.trim() === '/:') {
      throw new Error('🚨 Invalid route "/:" found!');
    }
  }
  return originalAppUse(path, ...handlers);
};



mongoose.connect(process.env.MONGO_URI)
.then(() => {
  server.listen(5000, () => {
    console.log('Server running on port 5000');
    console.log('Socket.IO server ready');
    console.log('MongoDB connected');
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

if(process.env.NODE_ENV==="production"){
  app.use(express.static(path.join(__dirname, "../frontend/dist")));


  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend" , "dist","index.html"));
  });
}










