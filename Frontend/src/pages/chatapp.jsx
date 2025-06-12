import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  Send, Phone, Video, Settings, Search, MoreVertical,
  Paperclip, Smile, Mic, UserPlus, Bell, Moon, Shield,
  HelpCircle, LogOut, Check, CheckCheck, Image, Camera 
} from 'lucide-react';
import { AuthContext } from '../components/authcontext';
import API from "../api";

const StatusIcon = ({ status }) => {
  if (status === 'read') return <CheckCheck className="w-4 h-4 text-blue-400" />;
  if (status === 'delivered') return <Check className="w-4 h-4 text-gray-400" />;
  return <Check className="w-4 h-4 text-gray-500" />;
};

export default function ChatApp() {
  const { user, token } = useContext(AuthContext);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
   const [isCreatingChat, setIsCreatingChat] = useState(false);
  
  const [showUserList, setShowUserList] = useState(false);
  const [activeTab, setActiveTab] = useState('chats');
  const [users, setUsers] = useState([]);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const currentChatRef = useRef(null);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    currentChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket setup
  useEffect(() => {
    if (!user || !token) return;

    const newSocket = io('http://localhost:5000', {
      withCredentials: true,
      auth: { token },
      transports: ['websocket']
    });

    socketRef.current = newSocket;

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to server');
      // Join user's room for receiving messages
      newSocket.emit('join-room', user._id);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // User presence events
    newSocket.on('online-users', (users) => {
      console.log('Online users:', users);
      setOnlineUsers(users);
    });

    newSocket.on('user-connected', (userId) => {
      console.log('User connected:', userId);
      setOnlineUsers(prev => [...new Set([...prev, userId])]);
    });

    newSocket.on('user-disconnected', (userId) => {
      console.log('User disconnected:', userId);
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

       // Message events
    newSocket.on('new-message', (message) => {
      console.log('New message received:', message);
      
      // Add to messages if it's for the current chat
      const currentChat = currentChatRef.current;
      if (currentChat && message.chatId === currentChat._id) {
        const formattedMessage = {
          ...message,
          isMine: message.sender === user._id,
          time: new Date(message.createdAt).toLocaleTimeString(),
          status: message.sender === user._id ? 'delivered' : 'received'
        };
        setMessages(prev => {
          // Avoid duplicates
          const exists = prev.some(msg => msg._id === message._id);
          if (exists) return prev;
          return [...prev, formattedMessage];
        });
      }
      
      // Update chat list
      updateChatList(message);
    });

     // Handle successful message send
    newSocket.on('message-sent', (message) => {
      console.log('Message sent confirmation:', message);
      
      // Update the temporary message with the real message data
      const currentChat = currentChatRef.current;
      if (currentChat && message.chatId === currentChat._id) {
        setMessages(prev => prev.map(msg => {
          if (msg._id && msg._id.toString().startsWith('temp-')) {
            return {
              ...message,
              isMine: message.sender === user._id,
              time: new Date(message.createdAt).toLocaleTimeString(),
              status: 'delivered'
            };
          }
          return msg;
        }));
      }
    });

    // Handle message send error
    newSocket.on('message-error', (error) => {
      console.error('Message send error:', error);
      // Remove the failed message or mark it as failed
      setMessages(prev => prev.filter(msg => !msg._id || !msg._id.toString().startsWith('temp-')));
    });

    // Message status updates
    newSocket.on('message-delivered', ({ messageId, chatId }) => {
      const currentChat = currentChatRef.current;
      if (currentChat && chatId === currentChat._id) {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, status: 'delivered' } : msg
        ));
      }
    });

    newSocket.on('message-read', ({ messageId, chatId }) => {
      const currentChat = currentChatRef.current;
      if (currentChat && chatId === currentChat._id) {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, status: 'read' } : msg
        ));
      }
    });

    // Handle new chat creation
    newSocket.on('chat-created', (newChat) => {
      console.log('New chat created:', newChat);
      setChats(prev => {
        // Check if chat already exists
        const exists = prev.some(chat => chat._id === newChat._id);
        if (exists) return prev;
         return [newChat, ...prev.filter(c => !c._id?.toString().startsWith('temp-'))];
      });
      
      // If this is the chat we were trying to create, select it
      if (isCreatingChat) {
        setSelectedChat(newChat);
        setIsCreatingChat(false);
        // Join the new chat room
        newSocket.emit('join-room', newChat._id);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user, token]);

  // Fetch initial data
  useEffect(() => {
    if (!token) return;
    fetchChats();
  }, [token]);

  const fetchChats = async () => {
    try {
      const response =  await API.get('/api/chats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const chatData = Array.isArray(response.data) ? response.data : response.data.chats || [];
      setChats(chatData);
      
      // Don't auto-select the first chat if we're creating a new one
      if (chatData.length && !selectedChat && !isCreatingChat) {
        setSelectedChat(chatData[0]);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      setChats([]);
    }
  };

  // Fetch users and update online status
  useEffect(() => {
    if (!token) return;

    const fetchUsers = async () => {
      try {
        const response = await API.get('/auth/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Users API response:', response.data);
        
        let userData = [];
        if (Array.isArray(response.data)) {
          userData = response.data;
        } else if (response.data && Array.isArray(response.data.users)) {
          userData = response.data.users;
        } else if (response.data && Array.isArray(response.data.data)) {
          userData = response.data.data;
        }

        const processedUsers = userData
          .filter(u => u._id !== user?._id) // Filter out current user
          .map(u => ({
            ...u,
            status: onlineUsers.includes(u._id) ? 'online' : 'offline'
          }));

        setUsers(processedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      }
    };

    fetchUsers();
  }, [token, onlineUsers, user]);

 // Load messages when chat is selected
  useEffect(() => {
    if (!selectedChat || !token || selectedChat._id?.toString().startsWith('temp-')) return;

    const loadMessages = async () => {
      try {
        const response = await API.get(`/messages/${selectedChat._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const messageData = Array.isArray(response.data) ? response.data : response.data.messages || [];
        const formattedMessages = messageData.map(msg => ({
          ...msg,
          isMine: msg.sender === user._id,
          time: new Date(msg.createdAt).toLocaleTimeString(),
          status: msg.sender === user._id ? (msg.status || 'delivered') : 'received'
        }));
        
        setMessages(formattedMessages);

        // Join the chat room
        if (socketRef.current) {
          socketRef.current.emit('join-room', selectedChat._id);
          
          // Mark messages as read
          socketRef.current.emit('mark-messages-read', {
            chatId: selectedChat._id,
            userId: user._id
          });
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
      }
    };

    loadMessages();
  }, [selectedChat, token, user]);

  const updateChatList = (message) => {
    setChats(prevChats => {
      const existingChatIndex = prevChats.findIndex(c => c._id === message.chatId);
      
      if (existingChatIndex !== -1) {
        const updatedChats = [...prevChats];
        updatedChats[existingChatIndex] = {
          ...updatedChats[existingChatIndex],
          lastMessage: message.content,
          updatedAt: message.createdAt,
          unread: message.sender !== user._id ? 
            (updatedChats[existingChatIndex].unread || 0) + 1 : 
            updatedChats[existingChatIndex].unread
        };
        
        // Move updated chat to top
        const [updatedChat] = updatedChats.splice(existingChatIndex, 1);
        return [updatedChat, ...updatedChats];
      }
      
      return prevChats;
    });
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedChat) return;

    // If it's a temporary chat, create the real chat first
    if (selectedChat._id?.toString().startsWith('temp-')) {
      const targetUser = selectedChat.participants.find(p => p._id !== user._id);
      if (targetUser) {
        try {
          setIsCreatingChat(true);
           console.log('Creating new chat with userId:', targetUser._id);
          const response = await API.post('/chats', { 
            userId: targetUser._id,
            type: 'direct'
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

           const newChat = response.data;
        console.log('New chat created:', newChat);
        
        setChats(prev => [newChat, ...prev.filter(c => !c._id?.toString().startsWith('temp-'))]);
        setSelectedChat(newChat);
          
          // Join the new chat room
          if (socketRef.current) {
            socketRef.current.emit('join-room', newChat._id);
          }
          
          // Now send the message with the real chat ID
          sendMessageToChat(newChat._id);
          setIsCreatingChat(false);
        } catch (error) {
          console.error('Error creating chat:', error);
          setIsCreatingChat(false);
          return;
        }
      }
    } else {
      sendMessageToChat(selectedChat._id);
    }
  };

  const sendMessageToChat = (chatId) => {
    if (!socketRef.current) return;

    const messageData = {
      chatId: chatId,
      content: messageInput.trim(),
      sender: user._id,
      recipients: selectedChat.participants
        .filter(p => p._id !== user._id)
        .map(p => p._id),
      createdAt: new Date().toISOString()
    };

    // Optimistic update
    const optimisticMessage = {
      ...messageData,
      _id: `temp-${Date.now()}`,
      isMine: true,
      status: 'sending',
      time: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setMessageInput('');
    
    // Send via WebSocket
    socketRef.current.emit('send-message', messageData);

    // Update chat list optimistically
    updateChatList(messageData);
  };

  // Improved: Create or find existing chat when user is clicked
  const startChatWithUser = async (userId) => {
    try {
      // First, check if chat already exists
      const existingChat = chats.find(chat => 
        chat.participants?.some(p => p._id === userId) &&
        chat.participants?.some(p => p._id === user._id) &&
        chat.participants?.length === 2
      );

      if (existingChat) {
        setSelectedChat(existingChat);
        setShowUserList(false);
        setMessages([]); // Clear messages to load fresh
        return;
      }

      // Create a temporary chat object for immediate UI feedback
      const targetUser = users.find(u => u._id === userId);
      if (targetUser) {
        const tempChat = {
          _id: `temp-${userId}`,
          participants: [user, targetUser],
          lastMessage: '',
          updatedAt: new Date().toISOString(),
          unread: 0,
          isTemporary: true
        };
        
        setSelectedChat(tempChat);
        setMessages([]); // Clear messages for new temp chat
        setShowUserList(false);
        
        // Add to chats list temporarily
        setChats(prev => {
          // Remove any existing temp chat for this user
          const filtered = prev.filter(c => c._id !== `temp-${userId}`);
          return [tempChat, ...filtered];
        });
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Helper function to get chat display name
  const getChatDisplayName = (chat) => {
    if (!chat.participants) return 'Unknown';
    const otherParticipant = chat.participants.find(p => p._id !== user._id);
    return otherParticipant ? (otherParticipant.username || otherParticipant.email) : 'Unknown';
  };

  if (!user) return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-80 bg-black/80 backdrop-blur-xl border-r border-gray-800/50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800/50 bg-gradient-to-r from-gray-900/50 to-black/50">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              ChatApp
            </h1>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowUserList(!showUserList)}
                className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-200 hover:scale-105"
                title="Find Users"
              >
                <UserPlus className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-200 hover:scale-105"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50 focus:border-blue-500/50 focus:outline-none text-sm backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800/50 bg-gray-900/30">
          {['chats', 'calls', 'groups'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 text-sm font-medium capitalize transition-all duration-200 ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              <p>No conversations yet</p>
              <p className="text-sm mt-1">Click the + button to start chatting</p>
            </div>
          ) : (
            chats.map((chat) => {
              const otherParticipant = chat.participants?.find(p => p._id !== user._id);
              const isOnline = otherParticipant && onlineUsers.includes(otherParticipant._id);
              
              return (
                <div
                  key={chat._id}
                  onClick={() => setSelectedChat(chat)}
                  className={`p-4 border-b border-gray-800/30 cursor-pointer transition-all duration-200 hover:bg-gray-800/30 ${
                    selectedChat?._id === chat._id ? 'bg-gray-800/50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-xl border border-gray-600/50">
                        {otherParticipant?.name?.charAt(0) || otherParticipant?.username?.charAt(0) || 'U'}
                      </div>
                      {isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm truncate">
                          {otherParticipant?.name || otherParticipant?.username || 'Unknown User'}
                        </h3>
                        <span className="text-xs text-gray-400">
                          {chat.updatedAt ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-400 truncate">{chat.lastMessage || 'No messages yet'}</p>
                        {chat.unread > 0 && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-800/50 bg-gradient-to-r from-black/80 to-gray-900/80 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-gray-600/50">
                      {selectedChat.participants?.find(p => p._id !== user._id)?.name?.charAt(0) || 
                       selectedChat.participants?.find(p => p._id !== user._id)?.username?.charAt(0) || 'U'}
                    </div>
                    {selectedChat && onlineUsers.includes(selectedChat.participants?.find(p => p._id !== user._id)?._id) && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold">
                      {selectedChat.participants?.find(p => p._id !== user._id)?.name || 
                       selectedChat.participants?.find(p => p._id !== user._id)?.username || 'Unknown User'}
                    </h2>
                    <p className="text-xs text-gray-400">
                      {selectedChat && onlineUsers.includes(selectedChat.participants?.find(p => p._id !== user._id)?._id) 
                        ? 'Online' 
                        : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-200 hover:scale-105">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-200 hover:scale-105">
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-200 hover:scale-105">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-900/20 to-black/40">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8" />
                    </div>
                    <p>No messages yet</p>
                    <p className="text-sm mt-1">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl backdrop-blur-sm border ${
                        msg.isMine
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-500/30'
                          : 'bg-gray-800/80 text-gray-100 border-gray-700/50'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${
                        msg.isMine ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        <span className="text-xs">{msg.time}</span>
                        {msg.isMine && <StatusIcon status={msg.status} />}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-800/50 bg-gradient-to-r from-black/80 to-gray-900/80 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-200 hover:scale-105">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-200 hover:scale-105">
                    <Image className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-200 hover:scale-105">
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 relative">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full px-4 py-3 bg-gray-800/50 rounded-2xl border border-gray-700/50 focus:border-blue-500/50 focus:outline-none backdrop-blur-sm pr-24 resize-none max-h-32 min-h-[48px]"
                    rows="1"
                    style={{ lineHeight: '1.5' }}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    <button className="p-1.5 rounded-lg hover:bg-gray-700/50 transition-all duration-200">
                      <Smile className="w-5 h-5 text-gray-400" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-gray-700/50 transition-all duration-200">
                      <Mic className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim()}
                  className="p-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl hover:from-blue-500 hover:to-blue-400 transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-900/20 to-black/40">
            <div className="text-center text-gray-400">
              <div className="w-24 h-24 rounded-full bg-gray-800/50 flex items-center justify-center mx-auto mb-6">
                <Send className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Welcome to ChatApp</h2>
              <p className="text-lg mb-4">Select a conversation to start chatting</p>
              <button
                onClick={() => setShowUserList(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/25"
              >
                Find People to Chat
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="w-80 bg-black/90 backdrop-blur-xl border-l border-gray-800/50 p-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Settings</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-2 rounded-lg hover:bg-gray-800/50 transition-all duration-200 text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <div className="space-y-4">
            {[
              { icon: Bell, label: 'Notifications', desc: 'Manage your notifications' },
              { icon: Moon, label: 'Dark Mode', desc: 'Currently enabled' },
              { icon: Shield, label: 'Privacy', desc: 'Privacy settings' },
              { icon: HelpCircle, label: 'Help & Support', desc: 'Get help' },
              { icon: LogOut, label: 'Sign Out', desc: 'Sign out of your account' }
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/30 cursor-pointer transition-all duration-200"
              >
                <item.icon className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User List Panel */}
      {showUserList && (
        <div className="w-80 bg-black/90 backdrop-blur-xl border-l border-gray-800/50 p-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Find People</h3>
            <button
              onClick={() => setShowUserList(false)}
              className="p-2 rounded-lg hover:bg-gray-800/50 transition-all duration-200 text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <div className="space-y-3">
            {users.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
                <p className="text-sm mt-1">Check your connection</p>
              </div>
            ) : (
              users.map(userItem => (
                <div
                  key={userItem._id}
                  onClick={() => startChatWithUser(userItem._id)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/30 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-gray-600/50">
                      {userItem.name?.charAt(0) || userItem.username?.charAt(0) || userItem.email?.charAt(0) || 'U'}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${
                      userItem.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                    }`}></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{userItem.name || userItem.username || userItem.email || 'Unknown User'}</p>
                    <p className={`text-sm capitalize ${
                      userItem.status === 'online' ? 'text-green-400' : 'text-gray-400'
                    }`}>
                      {userItem.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}