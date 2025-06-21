import React from 'react';
import { Menu, User, Phone, Video } from 'lucide-react';
import { useAuthStore } from '../../Socket/useAuth';
import { useChatStore } from '../../Socket/useSocket';

const ChatHeader = ({ setIsMobileOpen, setShowProfile }) => {
  const { selectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  if (!selectedUser) {
      return (
        <div className="p-4 border-b border-gray-800 bg-gray-900">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all duration-200"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-white font-semibold">Select a chat</h2>
            <button
              onClick={() => setShowProfile(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all duration-200"
            >
              <User size={20} />
            </button>
          </div>
        </div>
      );
    }
  
    const isOnline = onlineUsers.includes(selectedUser._id);
  
    return (
      <div className="p-4 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all duration-200"
            >
              <Menu size={20} />
            </button>
            
            <div className="relative">
              {selectedUser.profilePic ? (
                <img 
                  src={selectedUser.profilePic} 
                  alt={selectedUser.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedUser.name?.charAt(0).toUpperCase() || selectedUser.email?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              {isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
              )}
            </div>
            
            <div>
              <h2 className="text-white font-semibold">{selectedUser.name || selectedUser.email}</h2>
              <p className="text-xs text-gray-400">
                {isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all duration-200">
              <Phone size={20} />
            </button>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all duration-200">
              <Video size={20} />
            </button> */}
            <button
              onClick={() => setShowProfile(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all duration-200"
            >
              <User size={20} />
            </button>
          </div>
        </div>
      </div>
    );
};

export default ChatHeader;