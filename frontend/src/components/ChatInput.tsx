import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle, Paperclip, Smile, Mic, MicOff } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  error: string | null;
  isListening: boolean;
  onVoiceInput: (text: string) => void;
  setIsListening: (val: boolean) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, error, isListening, onVoiceInput, setIsListening, disabled = false }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Start/stop listening based on isListening prop
  useEffect(() => {
    if (!isListening) {
      recognitionRef.current?.stop();
      return;
    }
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; // You can set to 'hi-IN' for Hindi
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      setMessage(transcript);
    };
    recognition.onend = () => {
      setIsListening(false);
      // Auto-send the message when speech ends
      setTimeout(() => {
        if (textareaRef.current && textareaRef.current.value.trim()) {
          onVoiceInput(textareaRef.current.value.trim());
          setMessage('');
        }
      }, 100); // Small delay to ensure transcript is set
    };
    recognition.onerror = () => {
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
    // setIsListening(true); // Already set by parent
    // eslint-disable-next-line
  }, [isListening]);

  // Mic button toggles listening
  const handleMicClick = () => {
    setIsListening(!isListening);
  };

  return (
    <div className="w-full">
      <div className="glass rounded-3xl shadow-2xl p-6 mx-auto max-w-4xl">
        {error && (
          <div className="mb-4 p-3 bg-red-100/80 backdrop-blur border border-red-300 rounded-xl text-red-700 flex items-center gap-2 slide-up">
            <AlertCircle size={16} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-4">
          {/* Voice Button */}
          <button
            type="button"
            onClick={handleMicClick}
            disabled={disabled}
            className={`flex-shrink-0 w-12 h-12 rounded-full transition-all duration-300 flex items-center justify-center shadow-lg ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse shadow-red-500/30' 
                : 'bg-white/90 text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:shadow-blue-500/20'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Main Input Container */}
          <div className="flex-1 relative">
            <div className="relative bg-white/95 backdrop-blur border-2 border-white/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 focus-within:border-blue-400 focus-within:shadow-blue-500/20">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={disabled ? "Sign in to continue chatting..." : "Type your message to Accord AI..."}
                disabled={isLoading || disabled}
                className="w-full resize-none rounded-2xl px-6 py-4 pr-16 text-gray-800 leading-6 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px] max-h-[120px] bg-transparent placeholder-gray-400 font-medium"
                rows={1}
              />
              
              {/* Character count indicator */}
              {message.length > 0 && (
                <div className="absolute bottom-2 left-4 text-xs text-gray-400">
                  {message.length} characters
                </div>
              )}
              
              {/* Emoji Button */}
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-all duration-200 hover:scale-110"
                title="Add emoji"
              >
                <Smile size={18} />
              </button>
            </div>
          </div>
          
          {/* Send Button */}
          <button
            type="submit"
            disabled={!message.trim() || isLoading || disabled}
            className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg group ${
              message.trim() && !isLoading && !disabled
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-gray-200/50'
            }`}
            title="Send message"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send size={18} className={`transition-transform duration-200 ${
                message.trim() && !isLoading && !disabled ? 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5' : ''
              }`} />
            )}
          </button>
        </form>

        {/* Help Text */}
        <div className="mt-4 flex justify-between items-center text-xs text-white/70">
          <span>Press Enter to send, Shift+Enter for new line</span>
          {isListening && (
            <span className="flex items-center gap-1 text-red-300 animate-pulse">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              Listening...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};