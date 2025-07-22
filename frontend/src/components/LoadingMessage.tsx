import React from 'react';
import { Bot } from 'lucide-react';

export const LoadingMessage: React.FC = () => {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 border border-slate-300 shadow-md">
        <Bot size={18} />
      </div>
      
      <div className="max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl">
        <div className="inline-block p-4 rounded-2xl rounded-bl-md bg-white border border-slate-200 shadow-md">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-sm text-gray-600 ml-2">Accord is thinking</span>
            <span className="inline-block w-0.5 h-4 bg-blue-500 animate-pulse"></span>
          </div>
        </div>
      </div>
    </div>
  );
};