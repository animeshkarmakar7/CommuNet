import React, { useState, useRef } from 'react';
import { Image, Send, X, Loader2 } from 'lucide-react';
import { useChatStore } from '../../Socket/useSocket';
import toast from 'react-hot-toast';

const MessageInput = () => {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);
  const { sendMessage, selectedUser, sendTypingIndicator } = useChatStore();

  const handleSend = async () => {
    if (!text.trim() && !image) return;
    if (!selectedUser) {
      toast.error('Please select a user first');
      return;
    }
    if (isSending) return; // ✅ Prevent double sending

    setIsSending(true);
    
    try {
      await sendMessage({
        text: text.trim(),
        image: image,
      });
      
      // ✅ Clear form only after successful send
      setText('');
      setImage(null);
      
      // ✅ Stop typing indicator
      if (sendTypingIndicator) {
        sendTypingIndicator(false);
      }
      
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // ✅ Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      // ✅ Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.onerror = () => {
        toast.error('Failed to read image file');
      };
      reader.readAsDataURL(file);
    }
  };

  // ✅ Handle typing indicators
  const handleTextChange = (e) => {
    setText(e.target.value);
    
    // ✅ Send typing indicator
    if (sendTypingIndicator && selectedUser) {
      sendTypingIndicator(true);
      
      // ✅ Stop typing indicator after 3 seconds of inactivity
      clearTimeout(window.typingTimer);
      window.typingTimer = setTimeout(() => {
        sendTypingIndicator(false);
      }, 3000);
    }
  };

  // ✅ Stop typing when component unmounts
  React.useEffect(() => {
    return () => {
      if (sendTypingIndicator) {
        sendTypingIndicator(false);
      }
      clearTimeout(window.typingTimer);
    };
  }, [sendTypingIndicator]);

  return (
    <div className="p-4 border-t border-gray-800 bg-gray-900">
      {image && (
        <div className="mb-3 relative inline-block">
          <img 
            src={image} 
            alt="Preview" 
            className="max-h-20 max-w-20 rounded-lg object-cover" 
          />
          <button
            onClick={() => setImage(null)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600 transition-colors"
            aria-label="Remove image"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Attach image"
          >
            <Image size={20} />
          </button>
        </div>

        <div className="flex-1 relative">
          <input
            type="text"
            value={text}
            onChange={handleTextChange}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            placeholder={selectedUser ? `Message ${selectedUser.fullName || selectedUser.username}...` : "Select a user to start messaging..."}
            className="w-full px-4 py-2 bg-gray-800 text-white rounded-full border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={(!text.trim() && !image) || !selectedUser || isSending}
          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
          aria-label="Send message"
        >
          {isSending ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageChange}
      />
    </div>
  );
};

export default MessageInput;
