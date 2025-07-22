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
    <div className="bg-white/95 backdrop-blur-xl border-t border-slate-200/50">
      <div className="max-w-4xl mx-auto p-4">
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle size={14} />
            <span className="font-medium">{error}</span>
          </div>
        )}
        
        <div className="relative">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            {/* Microphone Button */}
            <button
              type="button"
              onClick={handleMicClick}
              className={`flex-shrink-0 w-10 h-10 rounded-full ${isListening ? 'bg-blue-100 text-blue-600 animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-500'} flex items-center justify-center transition-colors duration-200`}
              title={isListening ? 'Stop listening' : 'Speak'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            {/* Attachment Button */}
            <button
              type="button"
              className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors duration-200"
            >
              <Paperclip size={18} />
            </button>
            
            {/* Main Input Container */}
            <div className="flex-1 relative">
              <div className="relative bg-white border border-slate-300 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 focus-within:border-blue-500 focus-within:shadow-lg focus-within:shadow-blue-500/10">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Accord..."
                  disabled={isLoading}
                  className="w-full resize-none rounded-2xl px-4 py-3 pr-20 text-sm leading-5 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] max-h-[120px] bg-transparent"
                  rows={1}
                />
                
                {/* Emoji Button */}
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors duration-200"
                >
                  <Smile size={16} />
                </button>
              </div>
            </div>
            
            {/* Send Button */}
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                message.trim() && !isLoading
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send size={16} className={`transition-transform duration-200 ${
                message.trim() && !isLoading ? 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5' : ''
              }`} />
            </button>
          </form>
        </div>
        
        {/* Help Text */}
        <div className="mt-2 text-xs text-slate-500 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};