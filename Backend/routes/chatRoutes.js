const express = require('express');
const router = express.Router();
const Chat = require('../Models/chat');
const Message = require('../Models/message');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// GET /api/chats - Get all chats for current user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const chats = await Chat.find({
      participants: userId
    })
    .populate('participants', 'name email username')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/chats - Create a new chat/conversation
router.post('/', auth, async (req, res) => {
  try {
    const { userId, type = 'direct' } = req.body;
    const currentUserId = req.user._id;

    console.log('Creating chat with:', { userId, currentUserId, type });

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Convert to ObjectIds to ensure proper format
    const currentUserObjectId = new mongoose.Types.ObjectId(currentUserId);
    const targetUserObjectId = new mongoose.Types.ObjectId(userId);

    // Check if the target user exists (optional but recommended)
    const User = require('../Models/user'); // Adjust path as needed
    const targetUser = await User.findById(targetUserObjectId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    // Check if chat already exists between these users
    const existingChat = await Chat.findOne({
      type: 'direct',
      participants: {
        $all: [currentUserObjectId, targetUserObjectId],
        $size: 2
      }
    }).populate('participants', 'name email username');

    if (existingChat) {
      console.log('Existing chat found:', existingChat._id);
      return res.json(existingChat);
    }

    // Create new chat with proper ObjectIds
    const chatData = {
      participants: [currentUserObjectId, targetUserObjectId],
      type: type,
      createdBy: currentUserObjectId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Creating new chat with data:', chatData);

    const newChat = new Chat(chatData);
    const savedChat = await newChat.save();
    
    console.log('Chat saved successfully:', savedChat._id);
    
    // Populate the saved chat for response
    const populatedChat = await Chat.findById(savedChat._id)
      .populate('participants', 'name email username');

    res.status(201).json(populatedChat);
  } catch (error) {
    console.error('Error creating chat:', error);
    
    // Send more detailed error information for debugging
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationErrors,
        details: error.message 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/chats/:chatId - Get specific chat details
router.get('/:chatId', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: 'Invalid chat ID' });
    }

    const chat = await Chat.findById(chatId)
      .populate('participants', 'name email username')
      .populate('lastMessage');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.some(p => p._id.toString() === userId.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this chat' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/chats/:chatId - Delete a chat (only for creator or admin)
router.delete('/:chatId', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: 'Invalid chat ID' });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Only creator can delete the chat
    if (chat.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this chat' });
    }

    await Chat.findByIdAndDelete(chatId);
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;