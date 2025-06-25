import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../Socket/useAuth';
import { useChatStore } from '../Socket/useSocket';
import Sidebar from './chat/Sidebar';
import ChatArea from './chat/ChatArea';
import Profile from './chat/profile';
import AddUsersModal from './chat/AddUserModel';
import { Loader2 } from 'lucide-react';

const ChatDashboard = () => {
  const [showProfile, setShowProfile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showAddUsers, setShowAddUsers] = useState(false);
  const { authUser, checkAuth, connectSocket } = useAuthStore();
  const { unsubscribeMessages } = useChatStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authUser) {
      connectSocket();
    }
    
    return () => {
      unsubscribeMessages();
    };
  }, [authUser, connectSocket, unsubscribeMessages]);

  if (!authUser) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex overflow-hidden">
      <Sidebar 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        showAddUsers={showAddUsers}
        setShowAddUsers={setShowAddUsers}
      />
      
      <ChatArea 
        setIsMobileOpen={setIsMobileOpen}
        setShowProfile={setShowProfile}
      />
      
      <Profile 
        showProfile={showProfile}
        setShowProfile={setShowProfile}
      />

      <AddUsersModal 
        showAddUsers={showAddUsers}
        setShowAddUsers={setShowAddUsers}
      />
      
    
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      <style jsx>{`
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        .scrollbar-thumb-gray-600 {
          scrollbar-color: #4b5563 transparent;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* Webkit scrollbar styles */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #1f2937;
        }
        ::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default ChatDashboard;