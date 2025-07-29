import React from 'react';
import { Bot } from 'lucide-react';

export const LoadingMessage: React.FC = () => {
  return (
    <div className="flex items-start gap-2 sm:gap-3 mb-4 sm:mb-6">
      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-white text-slate-600 border border-slate-200 shadow-sm">
        <Bot size={16} className="sm:w-[18px] sm:h-[18px]" />
      </div>
      
      <div className="max-w-[280px] sm:max-w-md lg:max-w-lg xl:max-w-xl">
        <div className="inline-block p-3 sm:p-4 rounded-2xl rounded-bl-md bg-white border border-slate-200/50 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-xs sm:text-sm text-slate-600 ml-2">Accord is reflecting...</span>
            <span className="inline-block w-0.5 h-4 bg-purple-400 animate-pulse"></span>
          </div>
        </div>
      </div>
    </div>
  );
};