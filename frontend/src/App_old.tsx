import React, { useEffect, useRef, useState } from 'react';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessage } from './components/ChatMessage';
import { LoadingMessage } from './components/LoadingMessage';
import { ChatInput } from './components/ChatInput';
import { useChat } from './hooks/useChat';
import { Mic } from 'lucide-react';
import { VoiceChatScreen } from './components/VoiceChatScreen';

function App() {
  const { messages, isLoading, error, sendMessage, clearError } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pendingVoiceMessage, setPendingVoiceMessage] = useState<string | null>(null);
  const [showVoiceChat, setShowVoiceChat] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Determine if we should show LoadingMessage
  const showLoadingMessage = isLoading && (
    messages.length === 0 ||
    messages[messages.length - 1].role !== 'assistant'
  );

  // Conversation loop: after AI speaks, auto-listen for user
  const handleAssistantSpoken = () => {
    setIsSpeaking(false);
    setTimeout(() => setIsListening(true), 500); // Small delay for natural feel
  };

  // When user finishes speaking, auto-send
  const handleVoiceInput = (text: string) => {
    setIsListening(false);
    setPendingVoiceMessage(text);
  };

  // Send pending voice message when set
  useEffect(() => {
    if (pendingVoiceMessage) {
      sendMessage(pendingVoiceMessage);
      setPendingVoiceMessage(null);
    }
  }, [pendingVoiceMessage, sendMessage]);

  // When AI is typing, set isSpeaking true (for visual cue)
  useEffect(() => {
    if (isLoading && messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      setIsSpeaking(true);
    }
    if (!isLoading) {
      setIsSpeaking(false);
    }
  }, [isLoading, messages]);

  // Render VoiceChatScreen if open
  if (showVoiceChat) {
    return <VoiceChatScreen onClose={() => setShowVoiceChat(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex flex-col">
      <ChatHeader />
      {/* Visual cues for listening/speaking */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        {isListening && (
          <div className="px-6 py-2 bg-blue-100 text-blue-700 rounded-full shadow-lg animate-pulse font-medium">Accord is listening…</div>
        )}
        {isSpeaking && !isListening && (
          <div className="px-6 py-2 bg-blue-100 text-blue-700 rounded-full shadow-lg font-medium">Accord is speaking…</div>
        )}
      </div>
      <div className="flex-1 overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-y-auto pb-32">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Accord</h2>
                <p className="text-gray-600 max-w-md">Start a conversation with your AI assistant. Ask questions, get help, or just chat!</p>
              </div>
            )}
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                isTyping={isLoading && index === messages.length - 1 && message.role === 'assistant'}
                onAssistantSpoken={index === messages.length - 1 && message.role === 'assistant' ? handleAssistantSpoken : undefined}
                isSpeaking={isSpeaking && index === messages.length - 1 && message.role === 'assistant'}
              />
            ))}
            {showLoadingMessage && <LoadingMessage />}
            <div ref={messagesEndRef} />
          </div>
        </div>
        {/* Floating Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-20 pb-4">
          <ChatInput
            onSendMessage={sendMessage}
            isLoading={isLoading}
            error={error}
            isListening={isListening}
            onVoiceInput={handleVoiceInput}
            setIsListening={setIsListening}
          />
        </div>
        {/* Floating Voice Chat Button */}
        <button
          className="fixed bottom-8 right-8 z-40 w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-xl hover:bg-blue-600 transition text-3xl"
          title="Open Voice Chat"
          onClick={() => setShowVoiceChat(true)}
        >
          <Mic size={32} />
        </button>
      </div>
    </div>
  );
}

export default App;