import React from 'react';
import { Bot } from 'lucide-react';

export const LoadingMessage: React.FC = () => {
  return (
    <div className="flex items-start gap-4 mb-8 fade-in">
      <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-white to-gray-50 text-gray-700 border-2 border-gray-200 shadow-lg">
        <Bot size={20} />
      </div>
      
      <div className="max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-2xl">
        <div className="message-assistant p-5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
            <span className="text-sm text-gray-600 font-medium">Accord AI is thinking...</span>
            <div className="flex gap-1 ml-2">
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-400 font-medium">
          Just now
          <span className="ml-2 px-2 py-1 bg-gray-100 rounded-full text-gray-600">
            🤖 Accord AI
          </span>
        </div>
      </div>
    </div>
  );
};