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
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-xl">
            <Bot size={28} />
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">Accord AI</h1>
              <Sparkles size={20} className="text-yellow-300 animate-pulse" />
            </div>
            <p className="text-white/80 text-sm">Your intelligent AI companion</p>
          </div>
        </div>

        {/* User Section */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-white/20 rounded-full px-4 py-2 backdrop-blur">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full border-2 border-white/50"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                )}
                <span className="text-sm font-medium text-white">{user.displayName}</span>
              </div>
              <button
                onClick={onSignOut}
                className="p-3 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-105"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignInClick}
              className="px-6 py-3 bg-white/20 backdrop-blur text-white rounded-full hover:bg-white/30 transition-all duration-200 text-sm font-medium border border-white/30 hover:scale-105"
            >
              Sign In
            </button>
          )}
          
          <div className="flex items-center gap-2 bg-green-500/20 px-3 py-2 rounded-full">
            <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
            <span className="text-sm text-white/90 font-medium">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};