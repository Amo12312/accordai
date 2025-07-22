import React from 'react';
import { Bot, Sparkles, User, LogOut } from 'lucide-react';

interface ChatHeaderProps {
  user?: {
    displayName: string;
    email: string;
    photoURL?: string;
  } | null;
  onSignOut?: () => void;
  onSignInClick?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ user, onSignOut, onSignInClick }) => {
  return (
    <div className="border-b border-blue-200 bg-white/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
            <Bot size={24} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Accord GPT</h1>
              <Sparkles size={18} className="text-blue-500" />
            </div>
            <p className="text-sm text-gray-600">AI Assistant powered by Buddhist Future Tech</p>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <User size={16} className="text-gray-600" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700">{user.displayName}</span>
                </div>
                <button
                  onClick={onSignOut}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignInClick}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                Sign In
              </button>
            )}
          </div>
          
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
            <span className="text-sm text-gray-600 font-medium">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};