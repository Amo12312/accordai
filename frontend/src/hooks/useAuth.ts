import { useState, useEffect } from 'react';
import axios from 'axios';
// Firebase imports commented out due to CORS issues
// import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
// import { auth, googleProvider } from '../config/firebase';

const API_BASE_URL = 'http://localhost:5000/api';

interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isPremium: boolean;
  messageCount: number;
  isEmailVerified: boolean;
}

interface TrialStatus {
  isTrialActive: boolean;
  trialStartTime?: Date;
  trialEndTime?: Date;
  remainingTime: number;
  messageCount: number;
  maxMessages: number;
  isPremium?: boolean;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);

  // Check trial status function - defined early so it can be used in useEffect
  const checkTrialStatus = async () => {
    try {
      if (user) {
        const response = await axios.get(`${API_BASE_URL}/auth/trial-status`);
        
        if (response.data.success) {
          setTrialStatus(response.data);
          return response.data;
        }
      } else {
        // For anonymous users
        const anonymousTrialStatus = {
          isTrialActive: true,
          trialStartTime: new Date(),
          trialEndTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
          remainingTime: 30 * 60 * 1000,
          messageCount: 0,
          maxMessages: 10
        };
        setTrialStatus(anonymousTrialStatus);
        return anonymousTrialStatus;
      }
    } catch (error) {
      console.error('Trial status check error:', error);
      return null;
    }
  };

  // Setup axios interceptor for auth token
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [user]);

  // Check for existing session on app start
  useEffect(() => {
    const checkExistingSession = async () => {
      // Skip redirect result check when Firebase is disabled
      // Firebase redirect check commented out due to CORS issues
      /*
      try {
        const redirectResult = await getRedirectResult(auth);
        if (redirectResult) {
          console.log('🔍 Processing redirect result from Google...');
          await processGoogleAuthResult(redirectResult);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error processing redirect result:', error);
      }
      */

      // Check for existing token
      const storedToken = localStorage.getItem('authToken');
      
      if (storedToken) {
        try {
          // Verify token with backend
          const response = await axios.get(`${API_BASE_URL}/auth/verify-token`);
          
          if (response.data.success) {
            setUser(response.data.user);
            setIsAnonymous(false);
            console.log('✅ User session restored successfully');
          } else {
            // Token expired or invalid
            console.log('🔄 Token expired or invalid, clearing auth data');
            localStorage.removeItem('authToken');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
            setIsAnonymous(true);
            // Initialize trial status for anonymous users
            await checkTrialStatus();
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          // Token invalid, clear storage and reset to anonymous
          console.log('🔄 Clearing invalid auth data, switching to anonymous mode');
          localStorage.removeItem('authToken');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
          setIsAnonymous(true);
          // Initialize trial status for anonymous users
          await checkTrialStatus();
        }
      } else {
        setIsAnonymous(true);
        // Initialize trial status for anonymous users
        await checkTrialStatus();
      }
      
      setLoading(false);
    };

    checkExistingSession();
  }, []);

  // Sign up with email and password
  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email,
        password,
        displayName
      });

      if (response.data.success) {
        const { token, user: userData } = response.data;
        
        // Store token
        localStorage.setItem('authToken', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser(userData);
        setIsAnonymous(false);
        
        console.log('✅ User registered successfully');
        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || error.message || 'Registration failed';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });

      if (response.data.success) {
        const { token, user: userData } = response.data;
        
        // Store token
        localStorage.setItem('authToken', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser(userData);
        setIsAnonymous(false);
        
        console.log('✅ User signed in successfully');
        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google using Firebase (with fallback to mock)
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      
      // For now, use mock authentication to bypass CORS issues
      // You can enable Firebase later when CORS is properly configured
      return await signInWithGoogleMock();
      
      /* Commented out Firebase auth due to CORS issues
      let result;
      try {
        // Try popup first
        result = await signInWithPopup(auth, googleProvider);
      } catch (popupError: any) {
        console.log('Popup failed, trying redirect...', popupError);
        
        // If popup fails due to CORS, use redirect instead
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.message.includes('Cross-Origin-Opener-Policy') ||
            popupError.message.includes('window.closed')) {
          
          console.log('Using redirect authentication...');
          await signInWithRedirect(auth, googleProvider);
          // The redirect will handle the rest, so we return here
          return { success: true, message: 'Redirecting to Google...' };
        }
        
        throw popupError;
      }
      
      return await processGoogleAuthResult(result);
      */
      
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      // Fallback to mock if Firebase fails
      console.log('Firebase failed, using mock authentication...');
      return await signInWithGoogleMock();
    } finally {
      setLoading(false);
    }
  };

  // Mock Google authentication that works without Firebase
  const signInWithGoogleMock = async () => {
    try {
      // Create a realistic mock Google user
      const mockGoogleUser = {
        email: 'demo.user@gmail.com',
        displayName: 'Demo User',
        photoURL: 'https://lh3.googleusercontent.com/a/ACg8ocKgMm9hQd83wJFA09ypWWRSQfFGlPBIWWctLUUYyypXW_g-AJ6qWfg=s96-c',
        googleId: `demo-${Date.now()}`
      };
      
      console.log('🔍 Using mock Google auth:', mockGoogleUser);
      
      // Send to backend for registration/login
      const response = await axios.post(`${API_BASE_URL}/auth/google`, mockGoogleUser);
      
      if (response.data.success) {
        const { token, user: backendUser } = response.data;
        
        // Store token
        localStorage.setItem('authToken', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser(backendUser);
        setIsAnonymous(false);
        
        console.log('✅ Mock Google sign-in successful');
        return { success: true, message: 'Google authentication successful (demo mode)' };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Mock Google sign-in error:', error);
      const message = error.response?.data?.message || error.message || 'Google sign-in failed';
      throw new Error(message);
    }
  };

  // Alternative: Simple Google OAuth without Firebase (fallback)
  const signInWithGoogleSimple = async () => {
    try {
      setLoading(true);
      
      // Create a simple mock Google user for testing
      // In production, you'd implement proper Google OAuth flow
      const mockGoogleUser = {
        email: `user.${Date.now()}@gmail.com`,
        displayName: 'Google User',
        photoURL: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
        googleId: `google-${Date.now()}`
      };
      
      console.log('🔍 Using simple Google auth (mock):', mockGoogleUser);
      
      // Send to backend for registration/login
      const response = await axios.post(`${API_BASE_URL}/auth/google`, mockGoogleUser);
      
      if (response.data.success) {
        const { token, user: backendUser } = response.data;
        
        // Store token
        localStorage.setItem('authToken', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser(backendUser);
        setIsAnonymous(false);
        
        console.log('✅ Simple Google sign-in successful');
        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Simple Google sign-in error:', error);
      const message = error.response?.data?.message || error.message || 'Google sign-in failed';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };
  const processGoogleAuthResult = async (result: any) => {
    const user = result.user;
    
    // Prepare user data for backend
    const userData = {
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0],
      photoURL: user.photoURL || 'https://via.placeholder.com/40',
      googleId: user.uid
    };
    
    console.log('🔍 Sending user data to backend:', userData);
    
    // Send to backend for registration/login
    const response = await axios.post(`${API_BASE_URL}/auth/google`, userData);
    
    if (response.data.success) {
      const { token, user: backendUser } = response.data;
      
      // Store token
      localStorage.setItem('authToken', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(backendUser);
      setIsAnonymous(false);
      
      console.log('✅ Google sign-in successful');
      return { success: true, message: response.data.message };
    } else {
      throw new Error(response.data.message);
    }
  };

  // Request password reset
  const requestPasswordReset = async (email: string) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
        email
      });

      return { success: true, message: response.data.message };
    } catch (error: any) {
      console.error('Password reset request error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to send reset email';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Reset password with token
  const resetPassword = async (token: string, newPassword: string) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        token,
        newPassword
      });

      if (response.data.success) {
        const { token: authToken, user: userData } = response.data;
        
        // Store token and login user
        localStorage.setItem('authToken', authToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        
        setUser(userData);
        setIsAnonymous(false);
        
        console.log('✅ Password reset successful');
        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      const message = error.response?.data?.message || error.message || 'Password reset failed';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      
      // Clear local storage
      localStorage.removeItem('authToken');
      delete axios.defaults.headers.common['Authorization'];
      
      // Reset state
      setUser(null);
      setIsAnonymous(true);
      setTrialStatus(null);
      
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get current auth token
  const getAuthToken = () => {
    return localStorage.getItem('authToken');
  };

  return {
    user,
    loading,
    isAnonymous,
    trialStatus,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    requestPasswordReset,
    resetPassword,
    signOut,
    checkTrialStatus,
    getAuthToken
  };
};
