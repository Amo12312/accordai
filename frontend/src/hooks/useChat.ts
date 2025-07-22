import { useState, useCallback } from 'react';
import { Message } from '../types';

const BACKEND_URL = 'http://localhost:5000/api';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);

  const sendMessage = useCallback(async (content: string, isAnonymous: boolean = false, userToken?: string) => {
    // Rate limiting - wait at least 3 seconds between requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    const minDelay = 3000; // 3 seconds

    if (timeSinceLastRequest < minDelay) {
      const remainingDelay = minDelay - timeSinceLastRequest;
      setError(`Please wait ${Math.ceil(remainingDelay / 1000)} seconds before sending another message.`);
      return;
    }

    setError(null);
    setIsLoading(true);
    setLastRequestTime(now);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Choose endpoint based on authentication status
      const endpoint = isAnonymous ? '/ai/chat-anonymous' : '/ai/chat';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add auth token for authenticated users
      if (!isAnonymous && userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }

      // Make API call to backend
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: content,
          isAnonymous
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      
      if (!responseData.success) {
        throw new Error(responseData.message || 'Failed to get AI response');
      }

      // Add assistant message with response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseData.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      return {
        success: true,
        source: responseData.source,
        timestamp: responseData.timestamp
      };

    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    } finally {
      setIsLoading(false);
    }
  }, [messages, lastRequestTime]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearError,
    clearMessages,
  };
};