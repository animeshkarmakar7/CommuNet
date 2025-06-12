require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const socketIO = require("socket.io");
const http = require('http');
const jwt = require('jsonwebtoken');

// Import models
const Message = require("./Models/message");
const Chat = require("./Models/chat"); // Your new Chat model
const User = require("./Models/user"); // Assuming you have a User model

// Import routes
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageroutes');
const chatRoutes = require('./routes/chatRoutes'); 

// Import utilities
const { encrypt, decrypt } = require("./utils/encrpyt");

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:5173', // Your Vite frontend URL
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/chats', chatRoutes);

// Create HTTP server
const server = http.createServer(app);

// Configure Socket.IO with proper CORS
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store active users and their socket connections
const activeUsers = new Map(); // userId -> { socketId, userInfo }
const userSockets = new Map(); // socketId -> userId

// Authentication middleware for Socket.IO
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id || decoded._id).select('name email username avatar');
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.userInfo = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
};

// Apply authentication middleware
io.use(authenticateSocket);

// SOCKET.IO CONNECTION
io.on("connection", (socket) => {
  console.log("User connected:", socket.id, "User:", socket.userInfo.name);
  
  // Store user connection
  activeUsers.set(socket.userId, {
    socketId: socket.id,
    userInfo: socket.userInfo,
    lastSeen: new Date()
  });
  userSockets.set(socket.id, socket.userId);

  // Broadcast user online status
  broadcastUserStatus(socket.userId, 'online');

  // Join user to their personal room
  socket.join(socket.userId);

  // Handle joining a chat room
  socket.on("join_chat", async (data) => {
    try {
      const { chatId } = data;
      
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        socket.emit("error", { message: "Invalid chat ID" });
        return;
      }

      // Verify user is participant in this chat
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.isParticipant(socket.userId)) {
        socket.emit("error", { message: "Not authorized to join this chat" });
        return;
      }

      // Join the chat room
      socket.join(chatId);
      socket.emit("joined_chat", { chatId, message: "Joined chat successfully" });
      
      // Notify other participants
      socket.to(chatId).emit("user_joined_chat", {
        chatId,
        user: socket.userInfo,
        timestamp: new Date()
      });

      console.log(`User ${socket.userInfo.name} joined chat ${chatId}`);
    } catch (error) {
      console.error("Error joining chat:", error);
      socket.emit("error", { message: "Failed to join chat" });
    }
  });

  // Handle leaving a chat room
  socket.on("leave_chat", (data) => {
    const { chatId } = data;
    socket.leave(chatId);
    
    socket.to(chatId).emit("user_left_chat", {
      chatId,
      user: socket.userInfo,
      timestamp: new Date()
    });
  });

  // Handle sending messages with chat integration
  socket.on("send_message", async (data) => {
    try {
      const { chatId, content, messageType = 'text', fileUrl } = data;
      
      if (!chatId) {
        socket.emit("message_error", { error: "Chat ID is required" });
        return;
      }

      // Validate content
      if (messageType === 'text' && !content?.trim()) {
        socket.emit("message_error", { error: "Message content is required" });
        return;
      }

      // Find or create chat
      let chat = await Chat.findById(chatId).populate('participants', '_id name email username avatar');
      
      if (!chat) {
        socket.emit("message_error", { error: "Chat not found" });
        return;
      }

      // Check if user is participant
      if (!chat.isParticipant(socket.userId)) {
        socket.emit("message_error", { error: "Not authorized to send messages to this chat" });
        return;
      }

      // Get recipients (all participants except sender)
      const recipients = chat.participants
        .filter(p => p._id.toString() !== socket.userId)
        .map(p => p._id);

      // Encrypt content if it's text
      let messageContent = content;
      if (messageType === 'text' && content) {
        messageContent = encrypt(content.trim());
      }

      // Create message
      const messageData = {
        chatId: new mongoose.Types.ObjectId(chatId),
        sender: new mongoose.Types.ObjectId(socket.userId),
        recipients: recipients,
        messageType,
        status: 'sent',
        createdAt: new Date()
      };

      if (messageType === 'text') {
        messageData.content = messageContent;
      } else {
        messageData.fileUrl = fileUrl;
        messageData.content = messageContent || '';
      }

      const message = new Message(messageData);
      const savedMessage = await message.save();

      // Populate the saved message
      const populatedMessage = await Message.findById(savedMessage._id)
        .populate('sender', 'name email username avatar')
        .populate('recipients', 'name email username avatar');

      // Update chat's lastMessage and increment unread counts
      chat.lastMessage = savedMessage._id;
      chat.updatedAt = new Date();
      
      // Increment unread count for all recipients
      recipients.forEach(recipientId => {
        chat.incrementUnreadCount(recipientId);
      });
      
      await chat.save();

      // Prepare message for broadcast (decrypt for display)
      const messageForBroadcast = {
        ...populatedMessage.toObject(),
        content: messageType === 'text' && populatedMessage.content ? 
          decrypt(populatedMessage.content) : populatedMessage.content
      };

      // Emit to all participants in the chat
      io.to(chatId).emit("new_message", {
        message: messageForBroadcast,
        chatId
      });

      // Send delivery confirmations to online recipients
      recipients.forEach(recipientId => {
        const recipientSocket = activeUsers.get(recipientId.toString());
        if (recipientSocket) {
          io.to(recipientSocket.socketId).emit("message_delivered", {
            messageId: savedMessage._id,
            chatId,
            deliveredAt: new Date()
          });
        }
      });

      console.log(`Message sent in chat ${chatId} by ${socket.userInfo.name}`);

    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("message_error", { error: "Failed to send message" });
    }
  });

  // Handle typing indicators
  socket.on("typing_start", (data) => {
    const { chatId } = data;
    socket.to(chatId).emit("typing_status", {
      chatId,
      user: socket.userInfo,
      isTyping: true,
      timestamp: new Date()
    });
  });

  socket.on("typing_stop", (data) => {
    const { chatId } = data;
    socket.to(chatId).emit("typing_status", {
      chatId,
      user: socket.userInfo,
      isTyping: false,
      timestamp: new Date()
    });
  });

  // Handle marking messages as read
  socket.on("mark_message_read", async (data) => {
    try {
      const { messageId, chatId } = data;
      
      if (!mongoose.Types.ObjectId.isValid(messageId)) {
        return;
      }

      const message = await Message.findById(messageId);
      
      if (!message || !message.recipients.includes(socket.userId)) {
        return;
      }

      // Update message status
      message.status = 'read';
      message.readAt = new Date();
      message.readBy = message.readBy || [];
      
      if (!message.readBy.includes(socket.userId)) {
        message.readBy.push(socket.userId);
      }
      
      await message.save();

      // Update chat unread count
      const chat = await Chat.findById(chatId);
      if (chat) {
        chat.resetUnreadCount(socket.userId);
        await chat.save();
      }

      // Notify sender that message was read
      const senderSocket = activeUsers.get(message.sender.toString());
      if (senderSocket) {
        io.to(senderSocket.socketId).emit("message_read", {
          messageId,
          chatId,
          readBy: socket.userInfo,
          readAt: message.readAt
        });
      }

    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  });

  // Handle marking entire chat as read
  socket.on("mark_chat_read", async (data) => {
    try {
      const { chatId } = data;
      
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return;
      }

      const chatObjectId = new mongoose.Types.ObjectId(chatId);
      const userObjectId = new mongoose.Types.ObjectId(socket.userId);

      // Mark all unread messages in this chat as read
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

      // Reset unread count in chat
      const chat = await Chat.findById(chatId);
      if (chat) {
        chat.resetUnreadCount(socket.userId);
        await chat.save();
      }

      socket.emit("chat_marked_read", { chatId });

    } catch (error) {
      console.error("Error marking chat as read:", error);
    }
  });

  // Handle creating direct message chat
  socket.on("create_direct_chat", async (data) => {
    try {
      const { receiverId } = data;
      
      if (!mongoose.Types.ObjectId.isValid(receiverId)) {
        socket.emit("error", { message: "Invalid receiver ID" });
        return;
      }

      // Check if receiver exists
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        socket.emit("error", { message: "Receiver not found" });
        return;
      }

      // Find or create direct chat
      const chat = await Chat.findOrCreateDirectChat(socket.userId, receiverId);
      
      // Populate chat with participant details
      await chat.populate('participants', 'name email username avatar');
      
      socket.emit("direct_chat_created", { chat });

    } catch (error) {
      console.error("Error creating direct chat:", error);
      socket.emit("error", { message: "Failed to create direct chat" });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id, "User:", socket.userInfo?.name);
    
    // Remove user from active users
    activeUsers.delete(socket.userId);
    userSockets.delete(socket.id);
    
    // Broadcast user offline status
    broadcastUserStatus(socket.userId, 'offline');
  });
});

// Helper function to broadcast user status
function broadcastUserStatus(userId, status) {
  Chat.find({ participants: userId })
    .populate('participants', '_id')
    .then(chats => {
      chats.forEach(chat => {
        chat.participants.forEach(participant => {
          if (participant._id.toString() !== userId) {
            const participantSocket = activeUsers.get(participant._id.toString());
            if (participantSocket) {
              io.to(participantSocket.socketId).emit('user_status', {
                userId,
                status,
                timestamp: new Date()
              });
            }
          }
        });
      });
    })
    .catch(error => {
      console.error('Error broadcasting user status:', error);
    });
}

// API endpoint to get online users
app.get('/api/users/online', (req, res) => {
  const onlineUsers = Array.from(activeUsers.values()).map(user => ({
    userId: user.userInfo._id,
    name: user.userInfo.name,
    email: user.userInfo.email,
    username: user.userInfo.username,
    avatar: user.userInfo.avatar,
    lastSeen: user.lastSeen
  }));
  
  res.json({ onlineUsers, count: onlineUsers.length });
});

// API endpoint for health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    onlineUsers: activeUsers.size,
    mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Connect to MongoDB and start server
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

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = { app, server, io, activeUsers };