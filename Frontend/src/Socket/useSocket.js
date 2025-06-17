import { create } from "zustand";
import toast from "react-hot-toast";
import { useAuthStore } from "../Socket/useAuth";
import API from "../api";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  typingUsers: {},

  addUserIfNotExists: (newUser) => {
    const users = get().users;
    const exists = users.some((user) => user._id === newUser._id);
    if (!exists) {
      set({ users: [newUser, ...users] });
    }
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await API.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await API.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser } = get();
    const { authUser, socket } = useAuthStore.getState();
    
    if (!selectedUser || !authUser) {
      toast.error("Please select a user and ensure you're logged in");
      return;
    }

    try {
      // ✅ Send via API first
      const res = await API.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );

      const newMessage = res.data;

      if (!newMessage || !newMessage._id) {
        throw new Error("Invalid message response from server");
      }

      // ✅ Add to local state immediately (optimistic update)
      set((state) => {
        const messageExists = state.messages.some(msg => msg._id === newMessage._id);
        if (messageExists) return state;
        
        return {
          messages: [...state.messages, newMessage],
        };
      });

      // ✅ Then emit via socket for real-time delivery to receiver
      if (socket?.connected) {
        socket.emit("sendMessage", newMessage);
      } else {
        console.warn("Socket not connected, message sent via API only");
      }

    } catch (error) {
      console.error("Send message error:", error);
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    const { socket, authUser } = useAuthStore.getState();

    if (!selectedUser || !socket || !authUser) {
      console.warn("Cannot subscribe to messages: missing requirements");
      return;
    }

    // ✅ Clean up existing listeners
    socket.off("newMessage");
    socket.off("messageDelivered");
    socket.off("userTyping");
    socket.off("messageRead");

    // ✅ Handle incoming messages
    socket.on("newMessage", (newMessage) => {
      console.log("Received new message:", newMessage);

      if (!newMessage) {
        console.error("Received null message");
        return;
      }

      const { senderId, receiverId, _id } = newMessage;

      if (!senderId || !receiverId || !_id) {
        console.error("Invalid message structure:", newMessage);
        return;
      }

      // ✅ Only add if it's relevant to current chat
      const isChatRelevant = 
        (senderId === selectedUser._id && receiverId === authUser._id) ||
        (senderId === authUser._id && receiverId === selectedUser._id);

      if (!isChatRelevant) {
        console.log("Message not relevant to current chat");
        return;
      }

      // ✅ Only add if sender is NOT the current user (avoid duplicates)
      if (senderId === authUser._id) {
        console.log("Ignoring own message from socket (already added via API)");
        return;
      }

      // ✅ Add message to state
      set((state) => {
        const messageExists = state.messages.some(msg => msg._id === _id);
        if (messageExists) {
          console.log("Message already exists:", _id);
          return state;
        }
        
        return {
          messages: [...state.messages, newMessage],
        };
      });
    });

    // ✅ Handle delivery confirmations
    socket.on("messageDelivered", ({ messageId, delivered, receiverId }) => {
      console.log(`Message ${messageId} delivery status:`, delivered);
      // You can update message status in UI here
    });

    // ✅ Handle typing indicators
    socket.on("userTyping", ({ senderId, isTyping }) => {
      if (senderId === selectedUser._id) {
        set((state) => ({
          typingUsers: {
            ...state.typingUsers,
            [senderId]: isTyping
          }
        }));
      }
    });

    // ✅ Handle read receipts
    socket.on("messageRead", ({ messageId, readBy, readAt }) => {
      console.log(`Message ${messageId} read by ${readBy} at ${readAt}`);
      // Update message read status in UI
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
      toast.error(error.message || "Socket error occurred");
    });
  },

  unsubscribeMessages: () => {
    const { socket } = useAuthStore.getState();
    if (socket) {
      socket.off("newMessage");
      socket.off("messageDelivered");
      socket.off("userTyping");
      socket.off("messageRead");
      socket.off("error");
    }
  },

  setSelectedUser: (selectedUser) => {
    get().unsubscribeMessages();
    
    set({ 
      selectedUser,
      messages: [],
      typingUsers: {}
    });
    
    if (selectedUser) {
      get().getMessages(selectedUser._id);
      setTimeout(() => {
        get().subscribeToMessages();
      }, 100);
    }
  },

  // ✅ Typing indicators
  sendTypingIndicator: (isTyping) => {
    const { selectedUser } = get();
    const { socket } = useAuthStore.getState();
    
    if (selectedUser && socket?.connected) {
      socket.emit("typing", {
        receiverId: selectedUser._id,
        isTyping
      });
    }
  },

  removeDuplicateMessages: () => {
    set((state) => {
      const uniqueMessages = state.messages.filter((message, index, self) => 
        index === self.findIndex(m => m._id === message._id)
      );
      return { messages: uniqueMessages };
    });
  },
}));