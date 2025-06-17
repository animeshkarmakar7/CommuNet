const { Server } = require("socket.io");
const http = require("http");
const express = require("express");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
  },
});

const userSocketMap = {};

function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} mapped to socket ${socket.id}`);
  } else {
    console.warn("User connected without valid userId");
  }

  // Emit updated online users list
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // ✅ Fixed sendMessage handler
  socket.on("sendMessage", (messageData) => {
    console.log("Received sendMessage:", messageData);

    // ✅ Validate message data
    if (!messageData) {
      console.error("Received null/undefined message data");
      socket.emit("error", { message: "Invalid message data" });
      return;
    }

    const { senderId, receiverId, _id, text, createdAt } = messageData;

    // ✅ Validate required fields
    if (!senderId || !receiverId || !_id) {
      console.error("Missing required fields in message:", messageData);
      socket.emit("error", { message: "Missing required message fields" });
      return;
    }

    // ✅ Ensure the sender is the authenticated user
    if (senderId !== userId) {
      console.error("Sender ID mismatch. Expected:", userId, "Got:", senderId);
      socket.emit("error", { message: "Unauthorized message send" });
      return;
    }

    // ✅ Create properly structured message
    const formattedMessage = {
      _id,
      senderId,
      receiverId,
      text: text || messageData.message, // Support both 'text' and 'message' fields
      createdAt: createdAt || new Date().toISOString(),
      ...messageData // Include any other fields
    };

    console.log("Formatted message:", formattedMessage);

    // ✅ Get receiver socket
    const receiverSocketId = getReceiverSocketId(receiverId);
    console.log(`Receiver ${receiverId} socket:`, receiverSocketId);

    // ✅ Send to receiver (if online)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", formattedMessage);
      console.log(`Message sent to receiver ${receiverId}`);
    } else {
      console.log(`Receiver ${receiverId} is offline`);
    }

    // ✅ DON'T send back to sender - they already have it from the API response
    // The frontend adds the message to state immediately after successful API call
    // Sending it back causes duplicates
    
    // ✅ Optional: Send delivery confirmation to sender
    socket.emit("messageDelivered", {
      messageId: _id,
      delivered: !!receiverSocketId,
      receiverId
    });
  });

  // ✅ Handle typing indicators
  socket.on("typing", ({ receiverId, isTyping }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", {
        senderId: userId,
        isTyping
      });
    }
  });

  // ✅ Handle message read receipts
  socket.on("markAsRead", ({ messageId, senderId }) => {
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageRead", {
        messageId,
        readBy: userId,
        readAt: new Date().toISOString()
      });
    }
  });

  // ✅ Enhanced disconnect handler
  socket.on("disconnect", (reason) => {
    console.log(`User ${userId} disconnected:`, reason, socket.id);
    
    if (userId) {
      delete userSocketMap[userId];
      // Emit updated online users list
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
      console.log("Updated online users:", Object.keys(userSocketMap));
    }
  });

  // ✅ Handle connection errors
  socket.on("error", (error) => {
    console.error("Socket error for user", userId, ":", error);
  });

  // ✅ Handle custom disconnect
  socket.on("forceDisconnect", () => {
    console.log("Force disconnect for user:", userId);
    socket.disconnect(true);
  });
});

// ✅ Error handling for the server
io.on("connect_error", (error) => {
  console.error("Socket.IO connection error:", error);
});

console.log("Socket.IO server initialized");

module.exports = { io, app, server, getReceiverSocketId };