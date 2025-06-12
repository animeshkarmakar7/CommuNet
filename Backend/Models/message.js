const mongoose = require('mongoose');

// Define the schema for a chat message
const messageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Sender reference
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Receiver reference
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000 // Optional: limit message length
  },
  fileUrl: {
    type: String,
    default: null // Used if messageType is 'image' or 'file'
  },
  isRead: {
    type: Boolean,
    default: false // Indicates if the message was read
  },
  readAt: {
    type: Date // Timestamp when the message was read
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Indexes for faster performance on common queries
messageSchema.index({ from: 1, to: 1 });
messageSchema.index({ createdAt: -1 });

// Create and export the Message model
const Message = mongoose.model('Message', messageSchema);

module.exports = Message;

