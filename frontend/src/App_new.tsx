import React, { useEffect, useRef, useState } from 'react';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessage } from './components/ChatMessage';
import { LoadingMessage } from './components/LoadingMessage';
import { ChatInput } from './components/ChatInput';
import { AuthModal } from './components/AuthModal';
import { TrialBanner } from './components/TrialBanner';
import { useChat } from './hooks/useChat';
import { useAuth } from './hooks/useAuth';
import { Mic } from 'lucide-react';
import { VoiceChatScreen } from './components/VoiceChatScreen';

function App() {
  const { messages, isLoading, error, sendMessage, clearError } = useChat();
  const { 
    user, 
    loading: authLoading, 
    trialStatus, 
    isAnonymous, 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    signOut,
    updateTrialMessageCount,
    isTrialExpired
  } = useAuth();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pendingVoiceMessage, setPendingVoiceMessage] = useState<string | null>(null);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  // Check if user should be prompted to sign in
  useEffect(() => {
    if (isAnonymous && trialStatus && isTrialExpired()) {
      setShowAuthModal(true);
    }
  }, [isAnonymous, trialStatus, isTrialExpired]);

  // Handle message sending with trial tracking
  const handleSendMessage = async (message: string) => {
    // Check if trial is expired before sending
    if (isAnonymous && isTrialExpired()) {
      setShowAuthModal(true);
      return;
    }

    try {
      await sendMessage(message);
      
      // Update trial message count for anonymous users
      if (isAnonymous) {
        updateTrialMessageCount();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

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
    
    // Auto-send after brief delay
    setTimeout(() => {
      if (text.trim()) {
        handleSendMessage(text);
        setPendingVoiceMessage(null);
      }
    }, 1000);
  };

  // Handle authentication actions
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      setShowAuthModal(false);
    } catch (error) {
      console.error('Google sign in error:', error);
    }
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    try {
      await signInWithEmail(email, password);
      setShowAuthModal(false);
    } catch (error) {
      console.error('Email sign in error:', error);
      throw error;
    }
  };

  const handleEmailSignUp = async (email: string, password: string, displayName: string) => {
    try {
      await signUpWithEmail(email, password, displayName);
      setShowAuthModal(false);
    } catch (error) {
      console.error('Email sign up error:', error);
      throw error;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Trial Banner for anonymous users */}
      {isAnonymous && trialStatus && (
        <TrialBanner
          trialStatus={trialStatus}
          onSignInClick={() => setShowAuthModal(true)}
          isAnonymous={isAnonymous}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onGoogleSignIn={handleGoogleSignIn}
        onEmailSignIn={handleEmailSignIn}
        onEmailSignUp={handleEmailSignUp}
      />

      {/* Voice Chat Modal */}
      {showVoiceChat && (
        <VoiceChatScreen
          isOpen={showVoiceChat}
          onClose={() => setShowVoiceChat(false)}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          lastMessage={messages[messages.length - 1]}
          setIsSpeaking={setIsSpeaking}
          setIsListening={setIsListening}
          isListening={isListening}
          isSpeaking={isSpeaking}
        />
      )}

      <div className="flex flex-col h-screen">
        {/* Header */}
        <ChatHeader 
          user={user}
          onSignOut={signOut}
          onSignInClick={() => setShowAuthModal(true)}
        />
        
        {/* Main Chat Area */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 overflow-y-auto px-4 pb-32">
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
                {error}
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
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            error={error}
            isListening={isListening}
            onVoiceInput={handleVoiceInput}
            setIsListening={setIsListening}
            disabled={isAnonymous && isTrialExpired()}
          />
          {pendingVoiceMessage && (
            <div className="absolute bottom-20 left-4 right-4 bg-blue-100 border border-blue-300 rounded-lg p-3 text-blue-800">
              <p className="text-sm">Voice message: "{pendingVoiceMessage}"</p>
              <p className="text-xs opacity-75">Sending in 1 second...</p>
            </div>
          )}
        </div>
        
        {/* Floating Voice Chat Button */}
        <button
          className="fixed bottom-8 right-8 z-40 w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-xl hover:bg-blue-600 transition text-3xl"
          title="Open Voice Chat"
          onClick={() => setShowVoiceChat(true)}
          disabled={isAnonymous && isTrialExpired()}
        >
          <Mic size={32} />
        </button>
      </div>
    </div>
  );
}

export default App;
