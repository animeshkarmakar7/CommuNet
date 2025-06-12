const express = require('express');
const router = express.Router();
const Message = require('../Models/message'); // Adjust path if needed
const Chat = require('../Models/chat'); // You'll need this model
const auth = require('../middleware/auth'); // Your auth middleware
const mongoose = require('mongoose');

// GET /api/messages/conversations - Get list of conversations for current user
router.get('/conversations/list', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    // Get conversations from Chat model instead of aggregating messages
    const conversations = await Chat.find({
      participants: userId,
      type: 'direct' // assuming direct messages
    })
    .populate('participants', 'name email username')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    // Format the response
    const formattedConversations = conversations.map(chat => {
      const partner = chat.participants.find(p => p._id.toString() !== userId.toString());
      return {
        _id: chat._id,
        partnerId: partner._id,
        partnerName: partner.name || partner.username,
        partnerEmail: partner.email,
        lastMessage: chat.lastMessage?.content || '',
        lastMessageTime: chat.lastMessage?.createdAt || chat.updatedAt,
        unreadCount: chat.unreadCount || 0,
        participants: chat.participants
      };
    });

    res.json(formattedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/messages/:chatId - Get chat history with a specific chat
router.get('/:chatId', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: 'Invalid chat ID' });
    }

    // Check if user is participant in this chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(userId)) {
      return res.status(403).json({ message: 'Not authorized to view this chat' });
    }

    // Find messages in this chat
    const messages = await Message.find({ chatId: chatId })
      .sort({ createdAt: 1 }) // Sort by oldest first
      .populate('sender', 'name email username')
      .populate('recipients', 'name email username');

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/messages - Send a new message
router.post('/', auth, async (req, res) => {
  try {
    const { chatId, content, messageType = 'text', fileUrl } = req.body;
    const senderId = req.user._id;

    if (!chatId) {
      return res.status(400).json({ message: 'Chat ID is required' });
    }

    // Validate content based on message type
    if (messageType === 'text' && !content) {
      return res.status(400).json({ message: 'Content is required for text messages' });
    }

    if ((messageType === 'image' || messageType === 'file') && !fileUrl) {
      return res.status(400).json({ message: 'File URL is required for file/image messages' });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: 'Invalid chat ID' });
    }

    // Check if chat exists and user is participant
    const chat = await Chat.findById(chatId).populate('participants', '_id');
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.participants.some(p => p._id.toString() === senderId.toString())) {
      return res.status(403).json({ message: 'Not authorized to send messages to this chat' });
    }

    // Get recipients (all participants except sender)
    const recipients = chat.participants
      .filter(p => p._id.toString() !== senderId.toString())
      .map(p => p._id);

    const messageData = {
      chatId: new mongoose.Types.ObjectId(chatId),
      sender: new mongoose.Types.ObjectId(senderId),
      recipients: recipients,
      messageType,
      status: 'sent'
    };

    // Add content or fileUrl based on message type
    if (messageType === 'text') {
      messageData.content = content.trim();
    } else {
      messageData.fileUrl = fileUrl;
      messageData.content = content ? content.trim() : ''; // Optional caption for files
    }

    const newMessage = new Message(messageData);
    const savedMessage = await newMessage.save();
    
    // Populate the saved message for response
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate('sender', 'name email username')
      .populate('recipients', 'name email username');

    // Update chat's lastMessage and updatedAt
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: savedMessage._id,
      updatedAt: new Date()
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/messages/:messageId/read - Mark message as read
router.put('/:messageId/read', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: 'Invalid message ID' });
    }

    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only recipient can mark as read
    if (!message.recipients.some(r => r.toString() === userId.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update message status
    message.status = 'read';
    message.readAt = new Date();
    message.readBy = message.readBy || [];
    
    // Add user to readBy if not already there
    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
    }
    
    await message.save();

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/messages/mark-chat-read/:chatId - Mark all messages in a chat as read
router.put('/mark-chat-read/:chatId', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: 'Invalid chat ID' });
    }

    const chatObjectId = new mongoose.Types.ObjectId(chatId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Mark all unread messages in this chat where user is recipient as read
    await Message.updateMany(
      {
        chatId: chatObjectId,
        recipients: userObjectId,
        status: { $ne: 'read' }
      },
      {
        $set: {
          status: 'read',
          readAt: new Date()
        },
        $addToSet: {
          readBy: userObjectId
        }
      }
    );

    res.json({ message: 'Chat marked as read' });
  } catch (error) {
    console.error('Error marking chat as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/messages/:messageId - Delete a message
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: 'Invalid message ID' });
    }

    // Find the message and check if user is the sender
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only allow sender to delete their message
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(messageId);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;