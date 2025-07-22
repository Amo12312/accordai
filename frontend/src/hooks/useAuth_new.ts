import { useState, useEffect } from 'react';
import axios from 'axios';

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
            localStorage.removeItem('authToken');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
            setIsAnonymous(true);
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          // Token invalid, clear storage
          localStorage.removeItem('authToken');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
          setIsAnonymous(true);
        }
      } else {
        setIsAnonymous(true);
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

  // Sign in with Google (simplified for now)
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      // For now, let's create a mock Google user until we implement proper OAuth
      const mockGoogleUser = {
        email: `google.user.${Date.now()}@gmail.com`,
        displayName: 'Google User',
        photoURL: 'https://via.placeholder.com/40',
        googleId: 'google-' + Date.now()
      };
      
      const response = await axios.post(`${API_BASE_URL}/auth/google`, mockGoogleUser);
      
      if (response.data.success) {
        const { token, user: userData } = response.data;
        
        // Store token
        localStorage.setItem('authToken', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser(userData);
        setIsAnonymous(false);
        
        console.log('✅ Google sign-in successful');
        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      const message = error.response?.data?.message || error.message || 'Google sign-in failed';
      throw new Error(message);
    } finally {
      setLoading(false);
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

  // Check trial status
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
    checkTrialStatus
  };
};
