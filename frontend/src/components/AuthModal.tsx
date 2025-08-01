import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSignIn: () => Promise<void>;
  onEmailSignIn: (email: string, password: string) => Promise<void>;
  onEmailSignUp: (email: string, password: string, displayName: string) => Promise<void>;
  onForgotPassword?: (email: string) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onGoogleSignIn,
  onEmailSignIn,
  onEmailSignUp,
  onForgotPassword
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (isForgotPassword) {
        if (onForgotPassword) {
          await onForgotPassword(email);
          setSuccessMessage('Password reset link sent to your email!');
        }
      } else if (isSignUp) {
        await onEmailSignUp(email, password, displayName);
        onClose();
      } else {
        await onEmailSignIn(email, password);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await onGoogleSignIn();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setError('');
    setSuccessMessage('');
  };

  const switchToSignIn = () => {
    setIsSignUp(false);
    setIsForgotPassword(false);
    resetForm();
  };

  const switchToSignUp = () => {
    setIsSignUp(true);
    setIsForgotPassword(false);
    resetForm();
  };

  const switchToForgotPassword = () => {
    setIsForgotPassword(true);
    setIsSignUp(false);
    resetForm();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full relative overflow-hidden shadow-2xl">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/20 rounded-full p-1 transition-all"
          >
            <X size={20} />
          </button>

          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">
              {isForgotPassword ? '🔑 Reset Password' : (isSignUp ? '🌟 Join Accord GPT' : '✨ Welcome Back')}
            </h2>
            <p className="text-white/90 text-sm">
              {isForgotPassword 
                ? 'Enter your email to receive a password reset link'
                : (isSignUp 
                  ? 'Create your account for unlimited AI conversations' 
                  : 'Sign in to continue your AI journey'
                )
              }
            </p>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 shadow-sm">
              ⚠️ {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 shadow-sm">
              ✅ {successMessage}
            </div>
          )}

          {!isForgotPassword && (
            <>
              {/* Google Sign In Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none mb-4 shadow-lg flex items-center justify-center gap-3"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? '🔄 Connecting...' : '🚀 Continue with Google'}
              </button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-500 font-medium">or continue with email</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && !isForgotPassword && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" size={20} />
                <input
                  type="text"
                  placeholder="✨ Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-gradient-to-r from-purple-50 to-pink-50"
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" size={20} />
              <input
                type="email"
                placeholder="📧 Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gradient-to-r from-blue-50 to-purple-50"
                required
              />
            </div>

            {!isForgotPassword && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="🔒 Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gradient-to-r from-green-50 to-blue-50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:transform-none shadow-lg"
            >
              {loading ? '⏳ Loading...' : (isForgotPassword ? '📧 Send Reset Link' : (isSignUp ? '🎉 Create Account' : '🚀 Sign In'))}
            </button>
          </form>

          <div className="text-center mt-6 space-y-2">
            {!isForgotPassword && !isSignUp && (
              <button
                onClick={switchToForgotPassword}
                className="block w-full text-sm text-gray-500 hover:text-purple-600 transition-colors"
              >
                Forgot your password?
              </button>
            )}
            
            {isForgotPassword ? (
              <button
                onClick={switchToSignIn}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium transition-colors"
              >
                ← Back to Sign In
              </button>
            ) : (
              <button
                onClick={isSignUp ? switchToSignIn : switchToSignUp}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium transition-colors"
              >
                {isSignUp ? '👋 Already have an account? Sign in' : "🌟 Don't have an account? Sign up"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
