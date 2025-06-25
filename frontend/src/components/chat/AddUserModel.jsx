import React, { useState, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useAuthStore } from "../../Socket/useAuth";
import { useChatStore } from "../../Socket/useSocket";
import toast from "react-hot-toast";
import axios from "axios";
import API from '../../api';

const AddUsersModal = ({ showAddUsers, setShowAddUsers }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const { authUser, onlineUsers } = useAuthStore();
  const { setSelectedUser, getMessages , addUserIfNotExists  } = useChatStore();
  


  useEffect(() => {
    if (showAddUsers && searchTerm.trim()) {
      searchUsers();
    }
  }, [searchTerm]);

  const searchUsers = async () => {
    try {
      setLoadingSearch(true);
      const res = await API.get(
        `http://localhost:5000/api/users/search?name=${searchTerm}`,
        {
          headers: {
            Authorization: `Bearer ${authUser.token}`,
          },
        }
      );
      setSearchResults(res.data);
    } catch (err) {
      toast.error("Search failed");
    } finally {
      setLoadingSearch(false);
    }
  };

  if (!showAddUsers) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-md max-h-96 shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Find Users</h2>
            <button
              onClick={() => setShowAddUsers(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {loadingSearch ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="animate-spin text-gray-400" size={24} />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center text-gray-400 p-4">
                <p>No users found</p>
              </div>
            ) : (
              searchResults.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-lg cursor-pointer"
                  onClick={() => {
                    setSelectedUser(user);
                    getMessages(user._id);
                    addUserIfNotExists(user);
                    setShowAddUsers(false);
                    toast.success(`Chat started with ${user.name}`);
                  }}
                >
                  <div className="relative">
                    {user.profilePic ? (
                      <img
                        src={user.profilePic}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {onlineUsers.includes(user._id) && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{user.name}</h3>
                    <p className="text-sm text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddUsersModal;

