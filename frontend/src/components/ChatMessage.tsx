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
    <div className={`flex items-start gap-4 mb-8 ${isUser ? 'flex-row-reverse' : ''} fade-in`}>
      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
        isUser 
          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' 
          : 'bg-gradient-to-br from-white to-gray-50 text-gray-700 border-2 border-gray-200'
      }`}>
        {isUser ? <User size={20} /> : <Bot size={20} />}
      </div>
      
      <div className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-2xl ${
        isUser ? 'text-right' : 'text-left'
      }`}>
        <div className={`inline-block p-5 rounded-2xl shadow-xl relative transition-all duration-200 ${
          isUser
            ? 'message-user text-white'
            : 'message-assistant text-gray-800'
        }`}>
          {!isUser && isTyping && message.content.length === 0 ? (
            <div className="flex items-center gap-3">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
              <span className="text-sm text-gray-600 font-medium">Accord AI is thinking...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {displayedContent}
                {!isUser && isTyping && (
                  <span className="inline-block w-0.5 h-5 bg-blue-500 ml-1 animate-pulse"></span>
                )}
              </p>
              {isSpeaking && !isUser && (
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-gray-500">Speaking...</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className={`mt-2 text-xs text-gray-400 font-medium ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {!isUser && (
            <span className="ml-2 px-2 py-1 bg-gray-100 rounded-full text-gray-600">
              🤖 Accord AI
            </span>
          )}
        </div>
      </div>
    </div>
  );
};