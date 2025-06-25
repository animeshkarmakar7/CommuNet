import React, { useEffect, useRef, useCallback , useState } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../Socket/useAuth';
import { useChatStore } from '../../Socket/useSocket';
import Message from './Message';
import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';

const ChatArea = ({ setIsMobileOpen, setShowProfile }) => {
  const {
    messages,
    selectedUser,
    isMessagesLoading,
    getMessages,
    subscribeToMessages,
    unsubscribeMessages,
    removeDuplicateMessages ,
    typingUsers
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messagesEndRef = useRef(null);
  

  // ✅ Memoized scroll function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ✅ Fixed: Fetch messages when selectedUser changes
  useEffect(() => {
    if (selectedUser?._id) {
      console.log("📂 Fetching messages for user:", selectedUser._id);
      getMessages(selectedUser._id);
    }
  }, [selectedUser?._id, getMessages]);

  // ✅ Fixed: Subscribe to socket messages only when selectedUser changes
  useEffect(() => {
    if (selectedUser?._id) {
      console.log("🔌 Subscribing to messages for:", selectedUser._id);
      subscribeToMessages();
      
      return () => {
        console.log("🔌 Unsubscribing from messages");
        unsubscribeMessages();
      };
    }
  }, [selectedUser?._id]); // ✅ Removed function dependencies to prevent loops

  // ✅ Scroll when messages change
  useEffect(() => {
    if (messages.length > 0 || (selectedUser && typingUsers[selectedUser._id])) {
      scrollToBottom();
    }
  }, [messages.length, selectedUser?._id, typingUsers, scrollToBottom]); // ✅ Use length instead of whole array

  // ✅ Clean up duplicates periodically
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        removeDuplicateMessages();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [messages.length, removeDuplicateMessages]);

  // ✅ DEBUG: Log messages (less verbose)
  useEffect(() => {
    if (messages.length > 0) {
      console.log(`📨 ${messages.length} messages for ${selectedUser?.name || 'unknown'}`);
      // Log only the last message for debugging
      const lastMessage = messages[messages.length - 1];
      console.log("Last message:", {
        id: lastMessage._id,
        senderId: lastMessage.senderId,
        text: lastMessage.text?.substring(0, 50) + '...',
        createdAt: lastMessage.createdAt
      });
    }
  }, [messages.length, selectedUser?.name]);

   const TypingIndicator = () => {
    const isTyping = selectedUser && typingUsers[selectedUser._id];
    
    if (!isTyping) return null;

      return (
      <div className="flex justify-start mb-4 animate-fade-in">
        <div className="px-4 py-2 rounded-lg bg-gray-800 text-white w-fit max-w-[80%] shadow-md">
          <div className="flex items-center space-x-1">
            <span className="text-sm text-gray-300">
              {selectedUser.name || selectedUser.username} is typing
            </span>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  };


  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col">
        <ChatHeader setIsMobileOpen={setIsMobileOpen} setShowProfile={setShowProfile} />
        <div className="flex-1 flex items-center justify-center bg-black">
          <div className="text-center">
            <MessageCircle className="mx-auto mb-4 text-gray-600" size={64} />
            <h2 className="text-xl text-gray-400 mb-2">Welcome to Chat App</h2>
            <p className="text-gray-500">Select a user to start messaging</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <ChatHeader setIsMobileOpen={setIsMobileOpen} setShowProfile={setShowProfile} />

      <div className="flex-1 overflow-y-auto p-4 bg-black scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900">
        {isMessagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-gray-400" size={32} />
            <span className="ml-2 text-gray-400">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <MessageCircle size={48} className="mx-auto mb-2" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              // ✅ Enhanced key generation with fallback
              const messageKey = message._id || `${message.senderId}-${message.createdAt}-${index}`;
              
              return (
                <Message 
                  key={messageKey} 
                  message={message} 
                  authUser={authUser} 
                />
              );
            })}
               <TypingIndicator />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatArea;

