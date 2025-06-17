import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Message = ({ message, authUser }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // ✅ Enhanced null checks
  if (!message || !authUser) {
    console.warn('Message or authUser is null:', { message, authUser });
    return null;
  }

  const isOwn = message.senderId === authUser._id;

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Now';
    
    try {
      const date = new Date(timestamp);
      
      // ✅ Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Now';
      }
      
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      // ✅ Show relative time for recent messages
      if (diffInSeconds < 60) {
        return 'Just now';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m ago`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h ago`;
      } else {
        // ✅ Show time for older messages
        return date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Now';
    }
  };

  const handleImageError = () => {
    setImageError(true);
    console.error('Failed to load image:', message.image);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div 
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}
      data-message-id={message._id} // ✅ Add data attribute for debugging
    >
      <div
        className={`px-4 py-2 rounded-lg ${
          isOwn 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-800 text-white'
        } w-fit max-w-[80%] shadow-md`}
      >
        {/* ✅ Enhanced image handling */}
        {message.image && !imageError && (
          <div className="relative mb-2">
            {!imageLoaded && (
              <div className="flex items-center justify-center h-32 bg-gray-700 rounded-lg animate-pulse">
                <div className="text-gray-400 text-sm">Loading...</div>
              </div>
            )}
            <img
              src={message.image}
              alt="Shared content"
              className={`rounded-lg max-w-full h-auto max-h-64 object-cover ${
                imageLoaded ? 'block' : 'hidden'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
            />
          </div>
        )}

        {/* ✅ Show error if image failed to load */}
        {message.image && imageError && (
          <div className="mb-2 p-2 bg-red-900/20 border border-red-700 rounded-lg flex items-center space-x-2">
            <EyeOff size={16} className="text-red-400" />
            <span className="text-red-400 text-sm">Failed to load image</span>
          </div>
        )}

        {/* ✅ Enhanced text handling */}
        {message.text && (
          <div className="text-sm break-words whitespace-pre-wrap">
            {message.text}
          </div>
        )}

        {/* ✅ Show placeholder if no content */}
        {!message.text && !message.image && (
          <div className="text-sm text-gray-400 italic">
            [Empty message]
          </div>
        )}

        {/* ✅ Enhanced timestamp */}
        <div className={`text-xs mt-1 flex items-center justify-between ${
          isOwn ? 'text-blue-200' : 'text-gray-400'
        }`}>
          <time dateTime={message.createdAt}>
            {formatTime(message.createdAt || Date.now())}
          </time>
          
          {/* ✅ Debug info (remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <span className="ml-2 text-xs opacity-50">
              ID: {message._id?.slice(-4)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
