
// Expected Chat Model Schema - Models/chat.js
const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  type: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  name: {
    type: String,
    // Only required for group chats
    required: function() {
      return this.type === 'group';
    }
  },
  description: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // This adds createdAt and updatedAt automatically
});

// Index for faster queries
chatSchema.index({ participants: 1 });
chatSchema.index({ updatedAt: -1 });

// Pre-save validation
chatSchema.pre('save', function(next) {
  // Ensure participants array has at least 2 members
  if (this.participants.length < 2) {
    return next(new Error('Chat must have at least 2 participants'));
  }
  
  // For direct chats, ensure only 2 participants
  if (this.type === 'direct' && this.participants.length !== 2) {
    return next(new Error('Direct chat must have exactly 2 participants'));
  }
  
  next();
});

module.exports = mongoose.model('Chat', chatSchema);