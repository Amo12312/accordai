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
    <div className="border-b border-purple-200/50 bg-purple-50/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
      <div className="max-w-4xl mx-auto px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white shadow-md flex-shrink-0">
            <Bot size={16} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2">
              <h1 className="text-base sm:text-lg md:text-xl font-semibold text-purple-800 truncate">Accord GPT</h1>
              <Sparkles size={14} className="sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
            </div>
            <p className="text-xs sm:text-sm text-purple-600 truncate hidden xs:block">Your mindful AI companion</p>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
            {user ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="hidden sm:flex items-center gap-2">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow-sm"
                    />
                  ) : (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-200 flex items-center justify-center">
                      <User size={14} className="sm:w-4 sm:h-4 text-slate-600" />
                    </div>
                  )}
                  <span className="text-xs sm:text-sm font-medium text-slate-700 max-w-16 sm:max-w-24 truncate">{user.displayName}</span>
                </div>
                <button
                  onClick={onSignOut}
                  className="p-1.5 sm:p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-colors touch-target"
                  title="Sign Out"
                >
                  <LogOut size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignInClick}
                className="px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-md sm:rounded-lg hover:from-purple-600 hover:to-violet-600 transition-all text-xs sm:text-sm font-medium shadow-sm touch-target"
              >
                <span className="hidden xs:inline">Sign In</span>
                <span className="xs:hidden">Join</span>
              </button>
            )}
          </div>
          
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-sm"></div>
            <span className="text-xs sm:text-sm text-purple-600 font-medium">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};