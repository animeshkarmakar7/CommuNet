import React from 'react';
import { Settings, LogOut, X } from 'lucide-react';
import { useAuthStore } from '../../Socket/useAuth';


const Profile = ({ showProfile, setShowProfile }) => {
  const { authUser, logout } = useAuthStore();

   if (!showProfile || !authUser) return null;
  
    const handleLogout = async () => {
      try {
        await logout();
        setShowProfile(false);
      } catch (error) {
        toast.error('Failed to logout');
      }
    };
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-lg w-full max-w-md transform transition-all duration-300 scale-100">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Profile</h2>
              <button
                onClick={() => setShowProfile(false)}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="text-center mb-6">
              {authUser.profilePic ? (
                <img 
                  src={authUser.profilePic} 
                  alt={authUser.fullName}
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                  {authUser.fullName?.charAt(0).toUpperCase() || authUser.email?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              <h3 className="text-xl font-semibold text-white mb-2">{authUser.fullName || 'User'}</h3>
              <p className="text-gray-400">{authUser.email}</p>
              <p className="text-green-400 text-sm mt-2">Online</p>
            </div>
            
            <div className="space-y-3">
              <button className="w-full flex items-center space-x-3 p-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors duration-200">
                <Settings size={20} />
                <span>Settings</span>
              </button>
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 p-3 text-red-400 hover:bg-gray-800 rounded-lg transition-colors duration-200"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
};

export default Profile;