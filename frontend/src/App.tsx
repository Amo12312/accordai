import { useEffect, useRef, useState } from 'react';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessage } from './components/ChatMessage';
import { LoadingMessage } from './components/LoadingMessage';
import { ChatInput } from './components/ChatInput';
import { AuthModal } from './components/AuthModal';
import { TrialBanner } from './components/TrialBanner';
import { SubscriptionModal } from './components/SubscriptionModal';
import { UsageIndicator } from './components/UsageIndicator';
import PWAInstallBanner from './components/PWAInstallBanner';
import ConnectionStatus from './components/ConnectionStatus';
import { useChat } from './hooks/useChat';
import { useAuth } from './hooks/useAuth';
import { useSubscription } from './hooks/useSubscription';
import { SubscriptionPlan } from './types/subscription';

function App() {
  const { messages, isLoading, error, sendMessage, sendFile, clearError } = useChat();
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
    checkTrialStatus,
    getAuthToken
  } = useAuth();
  
  const {
    subscription,
    currentPlan,
    canSendMessage,
    messagesRemaining,
    subscribeToPlan,
    incrementMessageCount,
    getUsageStats
  } = useSubscription(user?.id);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pendingVoiceMessage, setPendingVoiceMessage] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
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

  // Handle message sending with subscription checks
  const handleSendMessage = async (message: string) => {
    // First check subscription limits
    if (!canSendMessage) {
      setShowSubscriptionModal(true);
      return;
    }

    // Check if trial is expired before sending (for anonymous users)
    if (isAnonymous && trialStatus) {
      const isExpired = trialStatus.trialEndTime && new Date() > new Date(trialStatus.trialEndTime);
      const isMessageLimitReached = trialStatus.messageCount >= trialStatus.maxMessages;
      
      if (isExpired || isMessageLimitReached) {
        setShowAuthModal(true);
        return;
      }
    }

    try {
      // Get the current auth token
      const authToken = getAuthToken();
      
      console.log('🚀 handleSendMessage:', { 
        isAnonymous, 
        hasUser: !!user, 
        hasToken: !!authToken, 
        userEmail: user?.email,
        subscriptionStatus: subscription?.status,
        currentPlan: currentPlan?.name,
        canSendMessage,
        messagesRemaining
      });
      
      // Call sendMessage with proper authentication parameters
      await sendMessage(message, isAnonymous, authToken || undefined);
      
      // Increment message count for subscription tracking
      if (user?.id && subscription) {
        await incrementMessageCount();
      }
      
      // Update trial status for anonymous users
      if (isAnonymous) {
        await checkTrialStatus();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle file upload with trial tracking
  const handleSendFile = async (file: File, customPrompt?: string) => {
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
      // Get the current auth token
      const authToken = getAuthToken();
      
      // Call sendFile with proper authentication parameters
      await sendFile(file, customPrompt, isAnonymous, authToken || undefined);
      
      // Update trial status for anonymous users
      if (isAnonymous) {
        await checkTrialStatus();
      }
    } catch (error) {
      console.error('Error processing file:', error);
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

  // Handle subscription plan selection
  const handleSelectPlan = async (plan: SubscriptionPlan, paymentId?: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      console.log('🔄 Subscribing to plan:', plan.name, paymentId ? 'with payment ID:' : 'free plan', paymentId);
      const result = await subscribeToPlan(plan.id, paymentId);
      
      if (result.success) {
        console.log('✅ Subscription successful:', result.message);
        setShowSubscriptionModal(false);
        
        // Show success message
        alert(`Successfully subscribed to ${plan.name} plan!`);
      } else {
        console.error('❌ Subscription failed:', result.message);
        alert(result.message);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to process subscription. Please try again.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-24 w-24 sm:h-32 sm:w-32 border-4 border-blue-200 border-t-blue-400 border-r-green-400 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-24 w-24 sm:h-32 sm:w-32 border-4 border-transparent border-b-green-200 border-l-blue-200 mx-auto animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }}></div>
          </div>
          <div className="mt-6 space-y-2">
            <p className="text-slate-700 font-medium text-lg">🌸 Accord GPT</p>
            <p className="text-slate-600 text-sm">Preparing your peaceful space...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50/30 to-indigo-50/20 safe-area-inset-top safe-area-inset-bottom">
      {/* Usage Indicator for subscribed users */}
      {user && !isAnonymous && subscription && (
        <div className="fixed top-2 left-2 z-40 max-w-xs">
          <UsageIndicator
            used={getUsageStats().used}
            limit={getUsageStats().limit}
            planName={currentPlan?.name || 'Free'}
            onUpgrade={() => setShowSubscriptionModal(true)}
            className="shadow-lg"
          />
        </div>
      )}

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
        <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50 bg-emerald-500 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl shadow-lg animate-fade-in max-w-[90vw] sm:max-w-none">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg">🌸</span>
            <span className="text-xs sm:text-sm font-medium">Welcome to your peaceful space</span>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSelectPlan={handleSelectPlan}
        currentPlan={subscription?.planId || 'free'}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onGoogleSignIn={handleGoogleSignIn}
        onEmailSignIn={handleEmailSignIn}
        onEmailSignUp={handleEmailSignUp}
        onForgotPassword={handleForgotPassword}
      />

      <div className="flex flex-col h-screen mobile-scroll">
        {/* Header */}
        <ChatHeader 
          user={user}
          onSignOut={signOut}
          onSignInClick={() => setShowAuthModal(true)}
        />
        
        {/* Usage Indicator for authenticated users */}
        {user && subscription && (
          <div className="px-2 sm:px-3 md:px-4 py-2">
            <UsageIndicator
              used={getUsageStats()?.used || 0}
              limit={currentPlan?.messageLimit || 10}
              planName={currentPlan?.name || 'Free'}
              onUpgrade={() => setShowSubscriptionModal(true)}
              className="max-w-4xl mx-auto"
            />
          </div>
        )}
        
        {/* Main Chat Area */}
        <div className="flex-1 overflow-hidden pb-20 sm:pb-24 md:pb-28">
          <div className="h-full overflow-y-auto px-2 sm:px-3 md:px-4 mobile-scroll">
            {error && (
              <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg sm:rounded-xl text-red-700 shadow-sm">
                <div className="flex items-center gap-2">
                  <span>🌊</span>
                  <span className="text-xs sm:text-sm">{error}</span>
                </div>
              </div>
            )}
            <div className="max-w-4xl mx-auto">
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
            </div>
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Fixed Input Area at Bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-purple-50/95 via-purple-50/90 to-purple-50/85 border-t border-purple-200/50 backdrop-blur-md z-30">
          <div className="max-w-4xl mx-auto">
            <ChatInput
              onSendMessage={handleSendMessage}
              onSendFile={handleSendFile}
              isLoading={isLoading}
              error={error}
              isListening={isListening}
              onVoiceInput={handleVoiceInput}
              setIsListening={setIsListening}
              disabled={!canSendMessage || !!(isAnonymous && trialStatus && (
                (trialStatus.trialEndTime && new Date() > new Date(trialStatus.trialEndTime)) ||
                trialStatus.messageCount >= trialStatus.maxMessages
              ))}
            />
          </div>
          {pendingVoiceMessage && (
            <div className="absolute bottom-full mb-2 left-2 right-2 sm:left-3 sm:right-3 md:left-4 md:right-4 mx-auto max-w-4xl bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200/50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-purple-800 shadow-lg backdrop-blur-sm">
              <p className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <span>🎙️</span>
                <span className="truncate">"{pendingVoiceMessage}"</span>
              </p>
              <p className="text-xs opacity-75 ml-6 hidden sm:block">Sending in a moment...</p>
            </div>
          )}
        </div>
      </div>

      {/* PWA Components */}
      <ConnectionStatus />
      <PWAInstallBanner />
    </div>
  );
}

export default App;