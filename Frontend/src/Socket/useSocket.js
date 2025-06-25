import { create } from "zustand";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuth";
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
      const res = await API.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );

      const newMessage = res.data;

      if (!newMessage || !newMessage._id) {
        throw new Error("Invalid message response from server");
      }

     
      set((state) => {
        const messageExists = state.messages.some(msg => msg._id === newMessage._id);
        if (messageExists) return state;
        
        return {
          messages: [...state.messages, newMessage],
        };
      });

    
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

  
    socket.off("newMessage");
    socket.off("messageDelivered");
    socket.off("userTyping");
    socket.off("messageRead");

   
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

     
      const isChatRelevant = 
        (senderId === selectedUser._id && receiverId === authUser._id) ||
        (senderId === authUser._id && receiverId === selectedUser._id);

      if (!isChatRelevant) {
        console.log("Message not relevant to current chat");
        return;
      }

     
      if (senderId === authUser._id) {
        console.log("Ignoring own message from socket (already added via API)");
        return;
      }

     
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

   
    socket.on("messageDelivered", ({ messageId, delivered, receiverId }) => {
      console.log(`Message ${messageId} delivery status:`, delivered);
    
    });

  
    socket.on("userTyping", ({ senderId, isTyping }) => {
      console.log(`User ${senderId} typing status:`, isTyping);
      
      if (senderId === selectedUser._id) {
        set((state) => ({
          typingUsers: {
            ...state.typingUsers,
            [senderId]: isTyping
          }
        }));

      
        if (isTyping) {
          setTimeout(() => {
            set((state) => ({
              typingUsers: {
                ...state.typingUsers,
                [senderId]: false
              }
            }));
          }, 5000);
        }
      }
    });

    
    socket.on("messageRead", ({ messageId, readBy, readAt }) => {
      console.log(`Message ${messageId} read by ${readBy} at ${readAt}`);
     
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
    
    
    const clearedTypingUsers = {};
    Object.keys(get().typingUsers).forEach(userId => {
      clearedTypingUsers[userId] = false;
    });
    
    set({ 
      selectedUser,
      messages: [],
      typingUsers: clearedTypingUsers 
    });
    
    if (selectedUser) {
      get().getMessages(selectedUser._id);
      setTimeout(() => {
        get().subscribeToMessages();
      }, 100);
    }
  },


  sendTypingIndicator: (isTyping) => {
    const { selectedUser } = get();
    const { socket } = useAuthStore.getState();
    
    if (selectedUser && socket?.connected) {
      console.log(`Sending typing indicator: ${isTyping} to ${selectedUser._id}`);
      
      socket.emit("typing", {
        receiverId: selectedUser._id,
        isTyping
      });
    }
  },

 
  clearTypingStatus: (userId) => {
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [userId]: false
      }
    }));
  },

 
  clearAllTypingStatus: () => {
    set((state) => {
      const clearedTypingUsers = {};
      Object.keys(state.typingUsers).forEach(userId => {
        clearedTypingUsers[userId] = false;
      });
      return { typingUsers: clearedTypingUsers };
    });
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