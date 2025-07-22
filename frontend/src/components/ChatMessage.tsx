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
    <div className={`flex items-start gap-3 mb-6 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
        isUser 
          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
          : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 border border-slate-300'
      }`}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>
      
      <div className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl ${
        isUser ? 'text-right' : 'text-left'
      }`}>
        <div className={`inline-block p-4 rounded-2xl shadow-lg relative ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md'
            : 'bg-white border border-slate-200 text-gray-800 rounded-bl-md shadow-md'
        }`}>
          {!isUser && isTyping && message.content.length === 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-sm text-gray-600 ml-2">Accord is thinking</span>
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {displayedContent}
              {!isUser && isTyping && (
                <span className="inline-block w-0.5 h-4 bg-blue-500 ml-0.5 animate-pulse"></span>
              )}
            </p>
          )}
        </div>
        
        <div className={`mt-2 text-xs text-gray-500 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};