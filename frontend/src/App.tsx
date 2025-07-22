import { useEffect, useRef, useState } from 'react';
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
    requestPasswordReset,
    signOut,
    checkTrialStatus
  } = useAuth();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pendingVoiceMessage, setPendingVoiceMessage] = useState<string | null>(null);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);

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
    if (isAnonymous && trialStatus) {
      const isExpired = trialStatus.trialEndTime && new Date() > new Date(trialStatus.trialEndTime);
      const isMessageLimitReached = trialStatus.messageCount >= trialStatus.maxMessages;
      
      if (isExpired || isMessageLimitReached) {
        setShowAuthModal(true);
      }
    }
  }, [isAnonymous, trialStatus]);

  // Handle message sending with trial tracking
  const handleSendMessage = async (message: string) => {
    // Check if trial is expired before sending
    if (isAnonymous && trialStatus) {
      const isExpired = trialStatus.trialEndTime && new Date() > new Date(trialStatus.trialEndTime);
      const isMessageLimitReached = trialStatus.messageCount >= trialStatus.maxMessages;
      
      if (isExpired || isMessageLimitReached) {
        setShowAuthModal(true);
        return;
      }
    }

    try {
      // Get the auth token from localStorage
      const userToken = localStorage.getItem('authToken');
      
      // Call sendMessage with proper parameters
      await sendMessage(message, isAnonymous, userToken || undefined);
      
      // Update trial status for anonymous users
      if (isAnonymous) {
        await checkTrialStatus();
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
      setAuthSuccess(true);
      setTimeout(() => {
        setShowAuthModal(false);
        setAuthSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Google sign in error:', error);
    }
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    try {
      await signInWithEmail(email, password);
      setAuthSuccess(true);
      setTimeout(() => {
        setShowAuthModal(false);
        setAuthSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Email sign in error:', error);
      throw error;
    }
  };

  const handleEmailSignUp = async (email: string, password: string, displayName: string) => {
    try {
      await signUpWithEmail(email, password, displayName);
      setAuthSuccess(true);
      setTimeout(() => {
        setShowAuthModal(false);
        setAuthSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Email sign up error:', error);
      throw error;
    }
  };

  const handleForgotPassword = async (email: string) => {
    try {
      await requestPasswordReset(email);
      setAuthSuccess(true);
      setTimeout(() => {
        setAuthSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-500 border-l-4 border-l-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Loading Accord GPT...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
      {/* Trial Banner for anonymous users */}
      {isAnonymous && trialStatus && (
        <TrialBanner
          trialStatus={trialStatus}
          onSignInClick={() => setShowAuthModal(true)}
          isAnonymous={isAnonymous}
        />
      )}

      {/* Success Message */}
      {authSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg fade-in">
          ✅ Successfully logged in! Welcome to Accord AI!
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onGoogleSignIn={handleGoogleSignIn}
        onEmailSignIn={handleEmailSignIn}
        onEmailSignUp={handleEmailSignUp}
        onForgotPassword={handleForgotPassword}
      />

      {/* Voice Chat Modal */}
      {showVoiceChat && (
        <VoiceChatScreen
          onClose={() => setShowVoiceChat(false)}
        />
      )}

      <div className="flex flex-col h-screen max-w-5xl mx-auto">
        {/* Header */}
        <div className="glass-dark rounded-b-2xl mx-4 mt-4 shadow-xl">
          <ChatHeader 
            user={user}
            onSignOut={signOut}
            onSignInClick={() => setShowAuthModal(true)}
          />
        </div>
        
        {/* Main Chat Area */}
        <div className="flex-1 relative overflow-hidden mx-4 my-6">
          <div className="glass rounded-2xl h-full relative shadow-2xl">
            <div className="absolute inset-0 overflow-y-auto p-6 pb-32">
              {error && (
                <div className="mb-6 p-4 bg-red-100/90 backdrop-blur border border-red-300 rounded-xl text-red-700 shadow-lg slide-up">
                  <div className="flex items-center">
                    <span className="text-xl mr-3">⚠️</span>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}
              
              {messages.length === 0 && !isLoading && (
                <div className="text-center py-16 fade-in">
                  <div className="text-7xl mb-6">🤖</div>
                  <h2 className="text-3xl font-bold text-gray-700 mb-3">Welcome to Accord AI</h2>
                  <p className="text-gray-600 text-lg max-w-md mx-auto">Your intelligent AI assistant is ready to help. Start a conversation by typing a message below.</p>
                  <div className="mt-8 flex flex-wrap justify-center gap-2">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm text-gray-600">💡 Ask anything</span>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm text-gray-600">🎨 Creative writing</span>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm text-gray-600">🔍 Research</span>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm text-gray-600">💻 Coding help</span>
                  </div>
                </div>
              )}
              
              {messages.map((message, index) => (
                <div key={message.id} className="fade-in">
                  <ChatMessage
                    message={message}
                    isTyping={isLoading && index === messages.length - 1 && message.role === 'assistant'}
                    onAssistantSpoken={index === messages.length - 1 && message.role === 'assistant' ? handleAssistantSpoken : undefined}
                    isSpeaking={isSpeaking && index === messages.length - 1 && message.role === 'assistant'}
                  />
                </div>
              ))}
              {showLoadingMessage && (
                <div className="slide-up">
                  <LoadingMessage />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
        
        {/* Floating Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600/30 via-purple-600/20 to-transparent pt-12 pb-6">
          <div className="max-w-5xl mx-auto px-4">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              error={error}
              isListening={isListening}
              onVoiceInput={handleVoiceInput}
              setIsListening={setIsListening}
              disabled={!!(isAnonymous && trialStatus && (
                (trialStatus.trialEndTime && new Date() > new Date(trialStatus.trialEndTime)) ||
                trialStatus.messageCount >= trialStatus.maxMessages
              ))}
            />
            {pendingVoiceMessage && (
              <div className="mt-4 glass rounded-xl p-4 text-white shadow-xl slide-up">
                <p className="font-medium flex items-center">
                  <span className="text-xl mr-3 animate-pulse">🎤</span>
                  Voice message: "{pendingVoiceMessage}"
                </p>
                <p className="text-sm opacity-75 mt-1">Sending in 1 second...</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Floating Voice Chat Button */}
        <button
          className="fixed bottom-8 right-8 z-40 w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-violet-600 text-white flex items-center justify-center shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 pulse-glow disabled:opacity-50 disabled:cursor-not-allowed"
          title="Open Voice Chat"
          onClick={() => setShowVoiceChat(true)}
          disabled={!!(isAnonymous && trialStatus && (
            (trialStatus.trialEndTime && new Date() > new Date(trialStatus.trialEndTime)) ||
            trialStatus.messageCount >= trialStatus.maxMessages
          ))}
        >
          <Mic size={28} />
        </button>
      </div>
    </div>
  );
}

export default App;