import { useState, useEffect, useCallback } from 'react';
import type { Conversation, ConversationMessage, ConversationContext } from '../models/types';
import {
  getAllConversations,
  getConversation,
  getConversationsForPart,
  addConversation,
  addMessageToConversation,
  onConversationsChange,
} from '../sync/yjsProvider';

// Generate unique ID
function generateId(): string {
  return 'conv_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// Hook for all conversations
export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(() => getAllConversations());

  useEffect(() => {
    const unsubscribe = onConversationsChange(setConversations);
    return unsubscribe;
  }, []);

  return conversations;
}

// Hook for a specific conversation
export function useConversation(conversationId: string | null) {
  const [conversation, setConversation] = useState<Conversation | null>(() =>
    conversationId ? getConversation(conversationId) ?? null : null
  );

  useEffect(() => {
    if (!conversationId) {
      setConversation(null);
      return;
    }

    const unsubscribe = onConversationsChange((conversations) => {
      const found = conversations.find(c => c.id === conversationId);
      setConversation(found ?? null);
    });

    return unsubscribe;
  }, [conversationId]);

  return conversation;
}

// Hook for conversations with a specific part
export function usePartConversations(partId: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    partId ? getConversationsForPart(partId) : []
  );

  useEffect(() => {
    if (!partId) {
      setConversations([]);
      return;
    }

    const unsubscribe = onConversationsChange((allConversations) => {
      setConversations(allConversations.filter(c => c.participantIds.includes(partId)));
    });

    return unsubscribe;
  }, [partId]);

  return conversations;
}

// Hook for managing conversation actions
export function useConversationActions() {
  const startConversation = useCallback((
    participantIds: string[],
    context: ConversationContext = 'casual'
  ): string => {
    const now = new Date().toISOString();
    const conversation: Conversation = {
      id: generateId(),
      participantIds,
      messages: [],
      context,
      createdAt: now,
      lastMessageAt: now,
    };

    addConversation(conversation);
    return conversation.id;
  }, []);

  const sendMessage = useCallback((
    conversationId: string,
    content: string,
    role: ConversationMessage['role'],
    partId?: string,
    emotion?: string
  ) => {
    const message: ConversationMessage = {
      id: generateId(),
      role,
      content,
      partId,
      emotion,
      timestamp: new Date().toISOString(),
    };

    addMessageToConversation(conversationId, message);
    return message;
  }, []);

  const sendUserMessage = useCallback((conversationId: string, content: string) => {
    return sendMessage(conversationId, content, 'user');
  }, [sendMessage]);

  const sendPartMessage = useCallback((
    conversationId: string,
    partId: string,
    content: string,
    emotion?: string
  ) => {
    return sendMessage(conversationId, content, 'part', partId, emotion);
  }, [sendMessage]);

  const sendNarratorMessage = useCallback((conversationId: string, content: string) => {
    return sendMessage(conversationId, content, 'narrator');
  }, [sendMessage]);

  return {
    startConversation,
    sendMessage,
    sendUserMessage,
    sendPartMessage,
    sendNarratorMessage,
  };
}
