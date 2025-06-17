import React, { useState, useEffect } from 'react';
import { Search, UserPlus, X, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../Socket/useAuth';
import { useChatStore } from '../../Socket/useSocket';

const Sidebar = ({ isMobileOpen, setIsMobileOpen, showAddUsers, setShowAddUsers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { 
    users, 
    selectedUser, 
    setSelectedUser, 
    getUsers, 
    isUsersLoading,
    getMessages,
    subscribeToMessages,
    unsubscribeMessages 
  } = useChatStore();
  const { authUser, onlineUsers } = useAuthStore();

   useEffect(() => {
     getUsers();
   }, [getUsers]);
 
   const filteredUsers = users.filter(user => 
     user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.email?.toLowerCase().includes(searchTerm.toLowerCase())
   );
 
   const handleUserSelect = async (user) => {
     if (selectedUser?._id === user._id) return;
     
     // Unsubscribe from previous user's messages
     unsubscribeMessages();
     
     // Set new selected user
     setSelectedUser(user);
     
     // Get messages for the selected user
     await getMessages(user._id);
     
     // Subscribe to new messages
     subscribeToMessages();
     
     // Close mobile sidebar
     setIsMobileOpen(false);
   };
 
   const isUserOnline = (userId) => onlineUsers.includes(userId);
 
   const getUserAvatar = (user) => {
     if (user.profilePic) return user.profilePic;
     return user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?';
   };
 
   return (
     <div className={`${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-30 w-80 h-full bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-300 ease-in-out`}>
       {/* Header */}
       <div className="p-4 border-b border-gray-800">
         <div className="flex items-center justify-between mb-4">
           <h1 className="text-xl font-bold text-white">Chats</h1>
           <div className="flex items-center space-x-2">
             <button 
               onClick={() => setShowAddUsers(true)}
               className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all duration-200"
               title="Find Users"
             >
               <UserPlus size={20} />
             </button>
             <button 
               onClick={() => setIsMobileOpen(false)}
               className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all duration-200"
             >
               <X size={20} />
             </button>
           </div>
         </div>
         
         {/* Search */}
         <div className="relative">
           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
           <input
             type="text"
             placeholder="Search users..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors duration-200"
           />
         </div>
       </div>
 
       {/* Users List */}
       <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
         {isUsersLoading ? (
           <div className="flex items-center justify-center p-8">
             <Loader2 className="animate-spin text-gray-400" size={24} />
           </div>
         ) : filteredUsers.length === 0 ? (
           <div className="p-4 text-center text-gray-400">
             <p>No users found</p>
           </div>
         ) : (
           filteredUsers
             .filter(user => user._id !== authUser?._id) // Don't show current user
             .map((user) => (
               <div
                 key={user._id}
                 onClick={() => handleUserSelect(user)}
                 className={`p-4 border-b border-gray-800 cursor-pointer transition-all duration-200 hover:bg-gray-800 ${
                   selectedUser?._id === user._id ? 'bg-gray-800 border-l-4 border-l-blue-500' : ''
                 }`}
               >
                 <div className="flex items-center space-x-3">
                   <div className="relative">
                     {user.profilePic ? (
                       <img 
                         src={user.profilePic} 
                         alt={user.name}
                         className="w-12 h-12 rounded-full object-cover"
                       />
                     ) : (
                       <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-white font-semibold">
                         {getUserAvatar(user)}
                       </div>
                     )}
                     {isUserOnline(user._id) && (
                       <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
                     )}
                   </div>
                   
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between">
                       <h3 className="text-white font-medium truncate">{user.name || user.email}</h3>
                     </div>
                     <div className="flex items-center justify-between mt-1">
                       <p className="text-sm text-gray-400 truncate">
                         {isUserOnline(user._id) ? 'Online' : 'Offline'}
                       </p>
                     </div>
                   </div>
                 </div>
               </div>
             ))
         )}
       </div>
     </div>
   );
};

export default Sidebar;