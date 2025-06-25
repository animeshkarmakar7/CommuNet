import { useState } from "react";
import { LogOut, X } from "lucide-react";
import { useAuthStore } from "../../Socket/useAuth";
import { User, Edit, Camera } from "lucide-react";

export default function ProfileSection({ showProfile, setShowProfile }) {
  const [isOnline, setIsOnline] = useState(true);
  const [username, setUsername] = useState("Alex Morgan");
  const [isEditing, setIsEditing] = useState(false);
  const [tempUsername, setTempUsername] = useState(username);

  const { authUser, logout } = useAuthStore();

  if (!showProfile || !authUser) return null;

  const handleLogout = async () => {
    try {
      await logout();
      setShowProfile(false);
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setTempUsername(username);
  };

  const handleSave = () => {
    setUsername(tempUsername);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempUsername(username);
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleAvatarClick = () => {
    // Handle avatar change logic here
    console.log("Change avatar clicked");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-6">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-3xl p-8 shadow-2xl backdrop-blur-sm max-w-md w-full">
        {/* Header */}
        <div className="flex justify-center items-center mb-8">
          <h2 className="text-white text-xl font-semibold">Profile</h2>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4 group">
            <div
              className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-all duration-300 hover:scale-105"
              onClick={handleAvatarClick}
            >
              <User className="w-12 h-12 text-white" />
            </div>
            {/* Change Avatar Overlay */}
            <div
              className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
              onClick={handleAvatarClick}
            >
              <Camera className="w-6 h-6 text-white" />
            </div>
            {/* Status Indicator */}
            <div
              className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-3 border-gray-800 transition-all duration-300 ${
                isOnline
                  ? "bg-green-500 shadow-lg shadow-green-500/50"
                  : "bg-gray-500"
              }`}
            />
          </div>

          {/* Username Section */}
          <div className="text-center w-full">
            {isEditing ? (
              <div className="flex flex-col items-center space-y-3">
                <input
                  type="text"
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-center"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <h3 className="text-white text-xl font-medium">{username}</h3>
                <Edit
                  className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer transition-colors"
                  onClick={handleEditClick}
                />
              </div>
            )}
          </div>

          {/* Status Text */}
          <div className="flex items-center space-x-2 mt-3">
            <div
              className={`w-2 h-2 rounded-full ${
                isOnline ? "bg-green-500" : "bg-gray-500"
              }`}
            />
            <span
              className={`text-sm font-medium ${
                isOnline ? "text-green-400" : "text-gray-400"
              }`}
            >
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-xl font-medium transition-colors">
            Edit Profile
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
  );
}
