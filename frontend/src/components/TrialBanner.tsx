import React, { useState, useEffect } from 'react';
import { Clock, MessageSquare, User } from 'lucide-react';

interface TrialBannerProps {
  trialStatus: {
    isTrialActive: boolean;
    trialEndTime?: Date;
    remainingTime: number;
    messageCount: number;
    maxMessages: number;
    isPremium?: boolean;
  } | null;
  onSignInClick: () => void;
  isAnonymous: boolean;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({
  trialStatus,
  onSignInClick,
  isAnonymous
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!trialStatus || !trialStatus.trialEndTime || !isAnonymous) return;

    const timer = setInterval(() => {
      const now = new Date();
      const endTime = new Date(trialStatus.trialEndTime!);
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(timer);
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [trialStatus, isAnonymous]);

  if (!isAnonymous || !trialStatus || trialStatus.isPremium) {
    return null;
  }

  const remainingMessages = Math.max(0, trialStatus.maxMessages - trialStatus.messageCount);
  const isExpired = !trialStatus.isTrialActive || remainingMessages === 0 || timeLeft === 'Expired';

  if (isExpired) {
    return (
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg mb-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="text-red-100" size={24} />
            <div>
              <h3 className="font-semibold">Trial Expired</h3>
              <p className="text-red-100 text-sm">
                Sign in to continue chatting with Accord AI
              </p>
            </div>
          </div>
          <button
            onClick={onSignInClick}
            className="bg-white text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg mb-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="text-blue-100" size={20} />
            <span className="font-medium">{timeLeft}</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="text-blue-100" size={20} />
            <span className="font-medium">{remainingMessages} left</span>
          </div>
        </div>
        <button
          onClick={onSignInClick}
          className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
        >
          Sign In for Unlimited
        </button>
      </div>
      <div className="mt-2">
        <div className="w-full bg-blue-400 bg-opacity-30 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{
              width: `${Math.max(10, (remainingMessages / trialStatus.maxMessages) * 100)}%`
            }}
          />
        </div>
      </div>
    </div>
  );
};
