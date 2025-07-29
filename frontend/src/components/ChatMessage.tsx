import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  isTyping?: boolean;
  onAssistantSpoken?: () => void;
  isSpeaking?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isTyping = false, onAssistantSpoken, isSpeaking }) => {
  const isUser = message.role === 'user';
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [hasSpoken, setHasSpoken] = useState(false);

  // Handle typing animation for assistant messages
  useEffect(() => {
    if (isUser) {
      setDisplayedContent(message.content);
      return;
    }

    if (message.content.length === 0) {
      setDisplayedContent('');
      setCurrentIndex(0);
      setHasSpoken(false);
      return;
    }

    // If content is shorter than before, reset animation
    if (message.content.length < displayedContent.length) {
      setDisplayedContent(message.content);
      setCurrentIndex(message.content.length);
      setHasSpoken(false);
      return;
    }

    // If content is longer, animate the new characters
    if (message.content.length > displayedContent.length) {
      const newContent = message.content.slice(0, currentIndex + 1);
      setDisplayedContent(newContent);
      
      if (currentIndex < message.content.length - 1) {
        const timer = setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
        }, 30); // Adjust speed here (lower = faster)
        
        return () => clearTimeout(timer);
      }
    }
  }, [message.content, isUser, currentIndex, displayedContent.length]);

  // Auto-speak the assistant's response as it types out
  useEffect(() => {
    if (!isUser && displayedContent && !isTyping && !hasSpoken) {
      window.speechSynthesis.cancel();
      const utter = new window.SpeechSynthesisUtterance(displayedContent);
      utter.lang = 'en-US'; // Set to 'hi-IN' for Hindi
      utter.onend = () => {
        setHasSpoken(true);
        if (onAssistantSpoken) onAssistantSpoken();
      };
      utter.onerror = () => {
        setHasSpoken(true);
        if (onAssistantSpoken) onAssistantSpoken();
      };
      utteranceRef.current = utter;
      window.speechSynthesis.speak(utter);
    }
    // Stop speaking if message changes
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [displayedContent, isUser, isTyping, hasSpoken, onAssistantSpoken]);

  return (
    <div className={`flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-sm ${
        isUser 
          ? 'bg-gradient-to-br from-purple-500 to-violet-500 text-white' 
          : 'bg-gradient-to-br from-slate-100 to-white text-slate-600 border border-slate-200'
      }`}>
        {isUser ? <User size={12} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" /> : <Bot size={12} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />}
      </div>
      
      <div className={`max-w-[240px] xs:max-w-[280px] sm:max-w-md lg:max-w-lg xl:max-w-xl ${
        isUser ? 'text-right' : 'text-left'
      }`}>
        <div className={`inline-block p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl shadow-sm relative ${
          isUser
            ? 'bg-gradient-to-br from-purple-500 to-violet-500 text-white rounded-br-md'
            : 'bg-white border border-slate-200/50 text-slate-800 rounded-bl-md shadow-sm backdrop-blur-sm'
        }`}>
          {!isUser && isTyping && message.content.length === 0 ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex gap-1">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-xs sm:text-sm text-slate-600 ml-1 sm:ml-2">Accord is reflecting...</span>
            </div>
          ) : (
            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
              {displayedContent}
              {!isUser && isTyping && (
                <span className="inline-block w-0.5 h-3 sm:h-4 bg-blue-400 ml-0.5 animate-pulse"></span>
              )}
            </p>
          )}
        </div>
        
        <div className={`mt-1 sm:mt-2 text-xs text-slate-500 ${isUser ? 'text-right' : 'text-left'}`}>
          <span className="hidden xs:inline">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="xs:hidden">
            {message.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </span>
          {isSpeaking && !isUser && (
            <span className="ml-1 sm:ml-2 text-purple-400">🔊</span>
          )}
        </div>
      </div>
    </div>
  );
};