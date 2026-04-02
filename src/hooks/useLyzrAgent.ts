import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isEscalation?: boolean;
}

interface UseLyzrAgentReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  sendMessage: (message: string) => Promise<void>;
  requestEscalation: (context: string) => Promise<void>;
  clearMessages: () => void;
}

export const useLyzrAgent = (): UseLyzrAgentReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const addMessage = useCallback((role: Message['role'], content: string, isEscalation = false) => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: new Date(),
      isEscalation,
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const getConversationHistory = useCallback(() => {
    return messages
      .filter(m => m.role !== 'system')
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');
  }, [messages]);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    setError(null);
    addMessage('user', message);
    setIsLoading(true);

    try {
      const conversationHistory = getConversationHistory();
      
      const { data, error: invokeError } = await supabase.functions.invoke('lyzr-chat', {
        body: {
          message: message.trim(),
          session_id: sessionId,
          conversation_history: conversationHistory,
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.session_id) {
        setSessionId(data.session_id);
      }

      const responseText = data?.response || 'I apologize, but I could not process your request. Please try again.';
      addMessage('assistant', responseText);

    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to communicate with the agent';
      setError(errorMessage);
      addMessage('system', `Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, addMessage, getConversationHistory]);

  const requestEscalation = useCallback(async (context: string) => {
    setError(null);
    addMessage('user', 'I would like to speak with a human agent.', true);
    setIsLoading(true);

    try {
      const conversationHistory = getConversationHistory();
      
      const { data, error: invokeError } = await supabase.functions.invoke('lyzr-chat', {
        body: {
          message: context,
          session_id: sessionId,
          escalate: true,
          conversation_history: conversationHistory,
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      const responseText = data?.response || 
        'I understand you would like to escalate this issue. A human agent will be notified and will reach out to you shortly.';
      addMessage('assistant', responseText, true);

    } catch (err) {
      console.error('Error requesting escalation:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to request escalation';
      setError(errorMessage);
      addMessage('system', `Escalation Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, addMessage, getConversationHistory]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sessionId,
    sendMessage,
    requestEscalation,
    clearMessages,
  };
};