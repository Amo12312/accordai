import { useState, useCallback } from 'react';
import axios from 'axios';
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
      console.log('🔍 Sending message:', { isAnonymous, endpoint, hasToken: !!userToken });
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add auth token for authenticated users only
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
        
        // If we get a 401 Unauthorized error, it means the token is invalid
        // Switch to anonymous mode and retry the request
        if (response.status === 401 && !isAnonymous) {
          console.log('🔄 Authentication failed, switching to anonymous mode and retrying...');
          
          // Clear invalid authentication
          localStorage.removeItem('authToken');
          delete axios.defaults.headers.common['Authorization'];
          
          // Retry with anonymous endpoint
          const retryResponse = await fetch(`${BACKEND_URL}/ai/chat-anonymous`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: content,
              isAnonymous: true
            }),
          });

          if (!retryResponse.ok) {
            const retryErrorData = await retryResponse.json();
            throw new Error(retryErrorData.message || `API Error: ${retryResponse.status} ${retryResponse.statusText}`);
          }

          const retryResponseData = await retryResponse.json();
          
          if (!retryResponseData.success) {
            throw new Error(retryResponseData.message || 'Failed to get AI response');
          }

          // Add AI response to messages
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: retryResponseData.response,
            role: 'assistant',
            timestamp: new Date()
          };

          setMessages(prev => [...prev, aiMessage]);
          setIsLoading(false);
          
          // Force page reload to reset authentication state
          window.location.reload();
          return;
        }
        
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

  const sendFile = useCallback(async (file: File, customPrompt?: string, isAnonymous: boolean = false, userToken?: string) => {
    // Rate limiting - wait at least 3 seconds between requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    const minDelay = 3000; // 3 seconds

    if (timeSinceLastRequest < minDelay) {
      const remainingDelay = minDelay - timeSinceLastRequest;
      setError(`Please wait ${Math.ceil(remainingDelay / 1000)} seconds before uploading another file.`);
      return;
    }

    setError(null);
    setIsLoading(true);
    setLastRequestTime(now);

    // Get file type description
    const getFileTypeDescription = (file: File) => {
      if (file.type === 'application/pdf') {
        return 'PDF';
      } else if (file.type.includes('word') || file.type.includes('document')) {
        return 'Word document';
      } else if (file.type.startsWith('image/')) {
        return 'image';
      }
      return 'file';
    };

    // Add user message showing the file upload
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: customPrompt 
        ? `📎 ${file.name} (${getFileTypeDescription(file)})\n\n${customPrompt}` 
        : `📎 Uploaded ${getFileTypeDescription(file)}: ${file.name}`,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Choose endpoint based on authentication status
      const endpoint = isAnonymous ? '/ai/file-anonymous' : '/ai/file';
      const headers: Record<string, string> = {};

      // Add auth token for authenticated users only
      if (!isAnonymous && userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      if (customPrompt) {
        formData.append('customPrompt', customPrompt);
      }

      // Make API call to backend
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      
      if (!responseData.success) {
        throw new Error(responseData.message || 'Failed to process file');
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
        fileName: responseData.fileName,
        fileType: responseData.fileType,
        extractedTextLength: responseData.extractedTextLength,
        additionalInfo: responseData.additionalInfo,
        timestamp: responseData.timestamp
      };

    } catch (err) {
      console.error('File processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process file. Please try again.');
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    } finally {
      setIsLoading(false);
    }
  }, [messages, lastRequestTime]);

  // Legacy PDF function for backward compatibility
  const sendPDF = sendFile;

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
    sendFile,
    sendPDF,
    clearError,
    clearMessages,
  };
};