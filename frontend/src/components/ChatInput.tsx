import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle, Smile, Mic, MicOff, Paperclip, FileText, Image, X } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onSendFile: (file: File, customPrompt?: string) => void;
  isLoading: boolean;
  error: string | null;
  isListening: boolean;
  onVoiceInput: (text: string) => void;
  setIsListening: (val: boolean) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  onSendFile,
  isLoading, 
  error, 
  isListening, 
  onVoiceInput, 
  setIsListening, 
  disabled = false 
}) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFile) {
      // Send file with optional custom prompt
      onSendFile(selectedFile, message.trim() || undefined);
      setSelectedFile(null);
      setMessage('');
    } else if (message.trim() && !isLoading && !disabled) {
      // Send regular text message
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/tiff'
      ];
      
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
      } else {
        alert('Please select a PDF, Word document (.docx, .doc), or image file (.jpg, .png, .gif, etc.)');
      }
    }
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText size={16} className="text-red-600" />;
    } else if (file.type.includes('word') || file.type.includes('document')) {
      return <FileText size={16} className="text-purple-600" />;
    } else if (file.type.startsWith('image/')) {
      return <Image size={16} className="text-green-600" />;
    }
    return <FileText size={16} className="text-gray-600" />;
  };

  const getFileTypeDescription = (file: File) => {
    if (file.type === 'application/pdf') {
      return 'PDF Document';
    } else if (file.type.includes('word') || file.type.includes('document')) {
      return 'Word Document';
    } else if (file.type.startsWith('image/')) {
      return 'Image (OCR)';
    }
    return 'Document';
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

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const canSubmit = (message.trim() || selectedFile) && !isLoading && !disabled;

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto p-2 sm:p-3 md:p-4">
        {error && (
          <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-red-50 border border-red-200/50 rounded-lg sm:rounded-xl flex items-center gap-2 text-red-700 text-xs sm:text-sm">
            <AlertCircle size={12} className="sm:w-[14px] sm:h-[14px] flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Selected File Display */}
        {selectedFile && (
          <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-purple-50 border border-purple-200/50 rounded-lg sm:rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {getFileIcon(selectedFile)}
                <div className="min-w-0 flex-1">
                  <span className="text-xs sm:text-sm font-medium text-purple-800 block truncate">{selectedFile.name}</span>
                  <div className="flex items-center gap-1 sm:gap-2 text-xs text-purple-600">
                    <span>{getFileTypeDescription(selectedFile)}</span>
                    <span>•</span>
                    <span>({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                  </div>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="text-purple-400 hover:text-purple-600 transition-colors p-1 touch-target flex-shrink-0"
                title="Remove file"
              >
                <X size={14} className="sm:w-4 sm:h-4" />
              </button>
            </div>
            <p className="text-xs text-purple-600 mt-1">
              {message.trim() ? 'Custom prompt will be used with file content' : 'File will be analyzed automatically'}
            </p>
          </div>
        )}
        
        <div className="relative">
          <form onSubmit={handleSubmit} className="flex items-end gap-1 sm:gap-2">
            {/* Microphone Button */}
            <button
              type="button"
              onClick={handleMicClick}
              disabled={disabled}
              className={`flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full ${
                isListening 
                  ? 'bg-purple-100 text-purple-600 animate-pulse shadow-md' 
                  : 'bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-500 shadow-sm'
              } flex items-center justify-center transition-all duration-200 touch-target ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? <MicOff size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Mic size={16} className="sm:w-[18px] sm:h-[18px]" />}
            </button>

            {/* Attachment Button */}
            <button
              type="button"
              onClick={handleAttachClick}
              disabled={disabled}
              className={`flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-500 shadow-sm flex items-center justify-center transition-all duration-200 touch-target ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Upload Files (PDF, Word, Images)"
            >
              <Paperclip size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.gif,.bmp,.tiff,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {/* Main Input Container */}
            <div className="flex-1 relative">
              <div className="relative bg-white/90 border border-slate-200 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 focus-within:border-purple-400 focus-within:shadow-lg focus-within:shadow-purple-400/20 focus-within:bg-white">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    disabled 
                      ? "Sign in to continue..." 
                      : selectedFile 
                        ? "Add a custom prompt for the file (optional)..."
                        : "Share your thoughts or upload files..."
                  }
                  disabled={isLoading || disabled}
                  className="w-full resize-none rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 pr-9 sm:pr-12 text-xs sm:text-sm leading-5 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px] sm:min-h-[44px] max-h-[100px] sm:max-h-[120px] bg-transparent placeholder:text-slate-400"
                  rows={1}
                />
                
                {/* Emoji Button */}
                <button
                  type="button"
                  disabled={disabled}
                  className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors duration-200 disabled:opacity-50 touch-target"
                >
                  <Smile size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
            
            {/* Send Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-200 touch-target ${
                canSubmit
                  ? 'bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
              title={selectedFile ? "Send File" : "Send message"}
            >
              <Send size={14} className={`sm:w-4 sm:h-4 transition-transform duration-200 ${
                canSubmit ? 'hover:translate-x-0.5 hover:-translate-y-0.5' : ''
              }`} />
            </button>
          </form>
        </div>
        
        {/* Help Text */}
        <div className="mt-1 sm:mt-2 text-xs text-slate-500 text-center px-2">
          <span className="hidden sm:inline">
            Press Enter to send • Shift+Enter for new line • Click 📎 to upload files
          </span>
          <span className="sm:hidden">
            Tap to send • 📎 for files
          </span>
        </div>
      </div>
    </div>
  );
};