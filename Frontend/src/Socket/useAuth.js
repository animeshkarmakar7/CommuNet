import { create } from "zustand";
import axiosInstance from "../api";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5000" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: JSON.parse(localStorage.getItem("authUser")) || null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  handleError: (error, defaultMessage) => {
    const message = error.response?.data?.message || defaultMessage;
    toast.error(message);
  },

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/me");
      set({ authUser: res.data.user });
      if (res.data.user) {
        get().connectSocket();
      }
    } catch (error) {
      console.error("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/register", data);
      set({ authUser: res.data.user });
      localStorage.setItem("authUser", JSON.stringify(res.data.user));
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      get().handleError(error, "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data.user });
      localStorage.setItem("authUser", JSON.stringify(res.data.user));
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      get().handleError(error, "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      localStorage.removeItem("authUser");
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      get().handleError(error, "Logout failed");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      localStorage.setItem("authUser", JSON.stringify(res.data));
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser) {
      console.warn("Cannot connect socket: No authenticated user");
      return;
    }

    // ✅ Disconnect existing socket first
    get().disconnectSocket();

    console.log("Connecting socket for user:", authUser._id);
    
    const newSocket = io(BASE_URL, {
      query: { userId: authUser._id },
      transports: ["websocket", "polling"], // Ensure fallback transport
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // ✅ Handle connection events
    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      set({ socket: newSocket });
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        // Server disconnected, try to reconnect
        newSocket.connect();
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      toast.error("Connection failed. Please check your internet connection.");
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log("Socket reconnected after", attemptNumber, "attempts");
      toast.success("Connection restored");
    });

    newSocket.on("reconnect_error", (error) => {
      console.error("Socket reconnection error:", error);
    });

    newSocket.on("reconnect_failed", () => {
      console.error("Socket reconnection failed");
      toast.error("Could not reconnect. Please refresh the page.");
    });

    // ✅ Handle online users
    newSocket.on("getOnlineUsers", (userIds) => {
      console.log("Online users updated:", userIds);
      set({ onlineUsers: userIds });
    });

    // ✅ Handle server errors
    newSocket.on("error", (error) => {
      console.error("Socket server error:", error);
      toast.error("Server error occurred");
    });

    // Set socket immediately for connection attempts
    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      console.log("Disconnecting socket");
      socket.removeAllListeners(); // ✅ Clean up all listeners
      if (socket.connected) {
        socket.disconnect();
      }
      set({ socket: null });
    }
  },

  // ✅ Add method to check socket status
  isSocketConnected: () => {
    const { socket } = get();
    return socket?.connected || false;
  },

  // ✅ Add method to reconnect socket manually
  reconnectSocket: () => {
    const { socket } = get();
    if (socket && !socket.connected) {
      socket.connect();
    } else {
      get().connectSocket();
    }
  },
}));
