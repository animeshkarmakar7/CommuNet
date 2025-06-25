import React, { useState } from 'react';
import { Settings, LogOut, X, Camera, Edit } from 'lucide-react';
import { useAuthStore } from '../../Socket/useAuth';
import AvatarSelection from '../chat/avatarSelection';

const Profile = ({ showProfile, setShowProfile }) => {
  const { authUser, logout, updateProfile } = useAuthStore();
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  if (!showProfile || !authUser) return null;
  
  const handleLogout = async () => {
    try {
      await logout();
      setShowProfile(false);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleAvatarUpdate = async (newAvatar) => {
    try {
      // Call your auth store update function
      await updateProfile({ profilePic: newAvatar });
    } catch (error) {
      console.error('Failed to update avatar:', error);
      throw error;
    }
  };

  return (
    <>
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
              <div className="relative inline-block">
                {authUser.profilePic ? (
                  <img 
                    src={authUser.profilePic} 
                    alt={authUser.name}
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                    {authUser.name?.charAt(0).toUpperCase() || authUser.email?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                
                {/* Avatar Edit Button */}
                <button
                  onClick={() => setShowAvatarModal(true)}
                  className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 rounded-full p-2 transition-colors duration-200 shadow-lg"
                  title="Change Avatar"
                >
                  <Camera size={16} className="text-white" />
                </button>
              </div>
              
              <h3 className="text-xl font-semibold text-white mb-2">{authUser.name || 'User'}</h3>
              <p className="text-gray-400">{authUser.email}</p>
              <p className="text-green-400 text-sm mt-2">Online</p>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => setShowAvatarModal(true)}
                className="w-full flex items-center space-x-3 p-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors duration-200"
              >
                <Edit size={20} />
                <span>Change Avatar</span>
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

      {/* Avatar Selection Modal */}
      <AvatarSelection
        showAvatarModal={showAvatarModal}
        setShowAvatarModal={setShowAvatarModal}
        currentAvatar={authUser.profilePic}
        onAvatarUpdate={handleAvatarUpdate}
      />
    </>
  );
};

export default Profile;

// import React from "react";
// import { useState, useEffect } from "react";
// import { LogOut, X, User, Edit, Camera } from "lucide-react";
// import { useAuthStore } from "../../Socket/useAuth";
// import { useChatStore } from "../../Socket/useSocket"; // You'll need this
// import { toast } from "react-hot-toast";

// export default function ProfileSection({ showProfile, setShowProfile }) {
//   const [isEditing, setIsEditing] = useState(false);
//   const [tempUsername, setTempUsername] = useState("");
//   const [isUpdating, setIsUpdating] = useState(false);

//   const { authUser, logout, updateUser } = useAuthStore();
//   const { socket } = useChatStore();

//   // Get real-time data from authUser instead of local state
//   const username = authUser?.fullName || authUser?.username || "";
//   const email = authUser?.email || "";
//   const isOnline = authUser?.isOnline || false;
//   const avatar = authUser?.profilePic || authUser?.avatar || null;

//   useEffect(() => {
//     if (!socket) return;

//     // Listen for real-time profile updates
//     socket.on("userProfileUpdated", (updatedUser) => {
//       if (updatedUser._id === authUser?._id) {
//         updateUser(updatedUser);
//         toast.success("Profile updated successfully!");
//         setIsEditing(false); // Close editing mode on successful update
//       }
//     });

//     // Listen for online status changes
//     socket.on("userStatusChanged", (data) => {
//       if (data.userId === authUser?._id) {
//         updateUser({ ...authUser, isOnline: data.isOnline });
//       }
//     });

//     // Listen for avatar updates
//     socket.on("userAvatarUpdated", (data) => {
//       if (data.userId === authUser?._id) {
//         updateUser({ ...authUser, avatar: data.avatar });
//         toast.success("Avatar updated successfully!");
//       }
//     });

//     return () => {
//       socket.off("userProfileUpdated");
//       socket.off("userStatusChanged");
//       socket.off("userAvatarUpdated");
//     };
//   }, [socket, authUser, updateUser]);

//   if (!showProfile || !authUser) return null;

//   const handleLogout = async () => {
//     try {
//       // Emit offline status before logout
//       if (socket) {
//         socket.emit("updateUserStatus", { 
//           userId: authUser._id, 
//           isOnline: false 
//         });
//       }
//       await logout();
//       setShowProfile(false);
//     } catch (error) {
//       toast.error("Failed to logout");
//     }
//   };

//   const handleEditClick = () => {
//     setIsEditing(true);
//     setTempUsername(username);
//   };

//   const handleSave = async () => {
//     if (!tempUsername.trim()) {
//       toast.error("Name cannot be empty");
//       return;
//     }
    
//     if (tempUsername.trim() === username) {
//       handleCancel();
//       return;
//     }

//     setIsUpdating(true);
//     try {
//       // Emit username update to server
//       if (socket) {
//         socket.emit("updateProfile", {
//           userId: authUser._id,
//           fullName: tempUsername.trim()
//         });
//       }
      
//       // Also update via HTTP API as backup
//       const response = await fetch(`/api/users/profile/${authUser._id}`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": `Bearer ${authUser.token}`
//         },
//         body: JSON.stringify({ fullName: tempUsername.trim() })
//       });

//       if (!response.ok) {
//         throw new Error("Failed to update profile");
//       }

//       const updatedUser = await response.json();
//       updateUser(updatedUser);
//       setIsEditing(false);
//       toast.success("Name updated successfully!");
      
//     } catch (error) {
//       toast.error("Failed to update name");
//       console.error("Profile update error:", error);
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   const handleCancel = () => {
//     setTempUsername(username);
//     setIsEditing(false);
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === "Enter") {
//       handleSave();
//     } else if (e.key === "Escape") {
//       handleCancel();
//     }
//   };

//   const handleAvatarClick = () => {
//     const input = document.createElement("input");
//     input.type = "file";
//     input.accept = "image/*";
//     input.onchange = handleAvatarUpload;
//     input.click();
//   };

//   const handleAvatarUpload = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     // Validate file size (max 5MB)
//     if (file.size > 5 * 1024 * 1024) {
//       toast.error("Image size should be less than 5MB");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("avatar", file);
//     formData.append("userId", authUser._id);

//     try {
//       const response = await fetch("/api/users/avatar", {
//         method: "POST",
//         headers: {
//           "Authorization": `Bearer ${authUser.token}`
//         },
//         body: formData
//       });

//       if (!response.ok) {
//         throw new Error("Failed to upload avatar");
//       }

//       const data = await response.json();
      
//       // Update local user state immediately
//       updateUser({ ...authUser, profilePic: data.avatar });
      
//       // Emit avatar update to all connected clients
//       if (socket) {
//         socket.emit("avatarUpdated", {
//           userId: authUser._id,
//           avatar: data.avatar
//         });
//       }

//       toast.success("Avatar updated successfully!");

//     } catch (error) {
//       toast.error("Failed to upload avatar");
//       console.error("Avatar upload error:", error);
//     }
//   };

//   const toggleOnlineStatus = () => {
//     if (socket) {
//       const newStatus = !isOnline;
//       socket.emit("updateUserStatus", {
//         userId: authUser._id,
//         isOnline: newStatus
//       });
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-6">
//       <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-3xl p-8 shadow-2xl backdrop-blur-sm max-w-md w-full">
//         {/* Close Button */}
//         <div className="flex justify-end mb-4">
//           <button
//             onClick={() => setShowProfile(false)}
//             className="text-gray-400 hover:text-white transition-colors"
//           >
//             <X size={20} />
//           </button>
//         </div>

//         {/* Header */}
//         <div className="flex justify-center items-center mb-8">
//           <h2 className="text-white text-xl font-semibold">Profile</h2>
//         </div>

//         {/* Avatar Section */}
//         <div className="flex flex-col items-center mb-8">
//           <div className="relative mb-4 group">
//             <div
//               className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden"
//               onClick={handleAvatarClick}
//             >
//               {avatar ? (
//                 <img 
//                   src={avatar} 
//                   alt="Profile" 
//                   className="w-full h-full object-cover"
//                 />
//               ) : (
//                 <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
//                   {username?.charAt(0).toUpperCase() || email?.charAt(0).toUpperCase() || '?'}
//                 </div>
//               )}
//             </div>
            
//             {/* Change Avatar Overlay */}
//             <div
//               className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
//               onClick={handleAvatarClick}
//             >
//               <Camera className="w-6 h-6 text-white" />
//             </div>
            
//             {/* Status Indicator - clickable to toggle */}
//             <div
//               className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-3 border-gray-800 transition-all duration-300 cursor-pointer ${
//                 isOnline
//                   ? "bg-green-500 shadow-lg shadow-green-500/50"
//                   : "bg-gray-500"
//               }`}
//               onClick={toggleOnlineStatus}
//               title="Click to toggle online status"
//             />
//           </div>

//           {/* Username Section */}
//           <div className="text-center w-full">
//             {isEditing ? (
//               <div className="flex flex-col items-center space-y-3">
//                 <input
//                   type="text"
//                   value={tempUsername}
//                   onChange={(e) => setTempUsername(e.target.value)}
//                   onKeyDown={handleKeyPress}
//                   className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-center"
//                   placeholder="Enter your name"
//                   autoFocus
//                   disabled={isUpdating}
//                 />
//                 <div className="flex space-x-2">
//                   <button
//                     onClick={handleSave}
//                     disabled={isUpdating || !tempUsername.trim()}
//                     className="px-4 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                   >
//                     {isUpdating ? "Saving..." : "Save"}
//                   </button>
//                   <button
//                     onClick={handleCancel}
//                     disabled={isUpdating}
//                     className="px-4 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </div>
//             ) : (
//               <div className="flex items-center justify-center space-x-2">
//                 <h3 className="text-white text-xl font-medium">{username || "Set your name"}</h3>
//                 <Edit
//                   className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer transition-colors"
//                   onClick={handleEditClick}
//                   title="Edit name"
//                 />
//               </div>
//             )}
            
//             {/* Email Section */}
//             {email && (
//               <p className="text-gray-400 text-sm mt-2">{email}</p>
//             )}
//           </div>

//           {/* Status Text */}
//           <div className="flex items-center space-x-2 mt-3">
//             <div
//               className={`w-2 h-2 rounded-full ${
//                 isOnline ? "bg-green-500" : "bg-gray-500"
//               }`}
//             />
//             <span
//               className={`text-sm font-medium cursor-pointer ${
//                 isOnline ? "text-green-400" : "text-gray-400"
//               }`}
//               onClick={toggleOnlineStatus}
//             >
//               {isOnline ? "Online" : "Offline"}
//             </span>
//           </div>
//         </div>

//         {/* Action Buttons */}
//         <div className="space-y-3">
//           <button 
//             className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-xl font-medium transition-colors"
//             onClick={() => setIsEditing(true)}
//           >
//             Edit Profile
//           </button>

//           <button
//             onClick={handleLogout}
//             className="w-full flex items-center justify-center space-x-3 p-3 text-red-400 hover:bg-gray-800 rounded-lg transition-colors duration-200"
//           >
//             <LogOut size={20} />
//             <span>Logout</span>
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }