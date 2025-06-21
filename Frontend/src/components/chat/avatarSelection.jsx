import React, { useState } from 'react';
import { User, Camera, Check, X } from 'lucide-react';

const AvatarSelection = ({ showAvatarModal, setShowAvatarModal, currentAvatar, onAvatarUpdate }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Predefined avatar options
  const avatarOptions = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Garland',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasmine',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Katherine',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Midnight',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Molly',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Nala',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Patches',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Princess',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sammy',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sassy',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Shadow',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Smokey',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Snowball'
  ];

  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar);
  };

  const handleSave = async () => {
    if (!selectedAvatar) return;
    
    setIsUpdating(true);
    try {
      await onAvatarUpdate(selectedAvatar);
      setShowAvatarModal(false);
    } catch (error) {
      console.error('Failed to update avatar:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setSelectedAvatar(currentAvatar || '');
    setShowAvatarModal(false);
  };

  if (!showAvatarModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center">
              <Camera className="mr-2" size={24} />
              Choose Your Avatar
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              <X size={24} />
            </button>
          </div>

          {/* Current Avatar Preview */}
          <div className="text-center mb-6">
            <h3 className="text-white mb-3">Current Selection</h3>
            <div className="flex justify-center">
              {selectedAvatar ? (
                <img 
                  src={selectedAvatar} 
                  alt="Selected avatar"
                  className="w-20 h-20 rounded-full object-cover border-4 border-blue-500"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-white">
                  <User size={32} />
                </div>
              )}
            </div>
          </div>

          {/* Avatar Options Grid */}
          <div className="mb-6">
            <h3 className="text-white mb-3">Choose an Avatar</h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              {avatarOptions.map((avatar, index) => (
                <div
                  key={index}
                  className={`relative cursor-pointer transition-all duration-200 ${
                    selectedAvatar === avatar 
                      ? 'ring-4 ring-blue-500 scale-105' 
                      : 'hover:scale-105 hover:ring-2 hover:ring-gray-500'
                  }`}
                  onClick={() => handleAvatarSelect(avatar)}
                >
                  <img 
                    src={avatar} 
                    alt={`Avatar option ${index + 1}`}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  {selectedAvatar === avatar && (
                    <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedAvatar || isUpdating}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isUpdating ? 'Updating...' : 'Save Avatar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarSelection;