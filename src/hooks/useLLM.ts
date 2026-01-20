import { useState, useCallback } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useGameStore } from '../store/gameStore';
import type { Part, PartPersonality, Relationship, Commitment, ConversationMessage } from '../models/types';
import {
  buildPartContext,
  chat,
  chatStream,
  generateChoices,
  generatePersonality,
  testApiKey,
} from '../services/llm';

// Hook for LLM interactions
export function useLLM() {
  const claudeApiKey = useSettingsStore((state) => state.claudeApiKey);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if LLM is available
  const isAvailable = Boolean(claudeApiKey);

  // Build config
  const getConfig = useCallback(() => {
    if (!claudeApiKey) {
      throw new Error('Claude API key not configured');
    }
    return { apiKey: claudeApiKey };
  }, [claudeApiKey]);

  // Send a message and get response
  const sendMessage = useCallback(async (
    part: Part,
    personality: PartPersonality | null,
    relationship: Relationship | null,
    activeCommitments: Commitment[],
    recentMessages: ConversationMessage[],
    userMessage: string
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const config = getConfig();
      const context = buildPartContext(part, personality, relationship, activeCommitments, recentMessages);
      const response = await chat(context, userMessage, config);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get response';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getConfig]);

  // Send message with streaming response
  const sendMessageStreaming = useCallback(async (
    part: Part,
    personality: PartPersonality | null,
    relationship: Relationship | null,
    activeCommitments: Commitment[],
    recentMessages: ConversationMessage[],
    userMessage: string,
    onChunk: (text: string) => void
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const config = getConfig();
      const context = buildPartContext(part, personality, relationship, activeCommitments, recentMessages);

      let fullResponse = '';
      for await (const chunk of chatStream(context, userMessage, config)) {
        fullResponse += chunk;
        onChunk(chunk);
      }

      return fullResponse;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get response';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getConfig]);

  // Generate response choices
  const getChoices = useCallback(async (
    part: Part,
    personality: PartPersonality | null,
    relationship: Relationship | null,
    partMessage: string
  ): Promise<string[]> => {
    try {
      const config = getConfig();
      const context = buildPartContext(part, personality, relationship, [], []);
      return await generateChoices(context, partMessage, config);
    } catch (err) {
      console.error('[useLLM] Failed to generate choices:', err);
      return ['Continue the conversation', 'Ask a question', 'Change the subject'];
    }
  }, [getConfig]);

  // Generate personality
  const generatePartPersonality = useCallback(async (
    part: Part
  ): Promise<{ traits: string[]; speechStyle: string; coreNeed: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const config = getConfig();
      return await generatePersonality(part, config);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate personality';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getConfig]);

  // Test API key
  const validateApiKey = useCallback(async (apiKey: string): Promise<boolean> => {
    return await testApiKey(apiKey);
  }, []);

  return {
    isAvailable,
    isLoading,
    error,
    sendMessage,
    sendMessageStreaming,
    getChoices,
    generatePartPersonality,
    validateApiKey,
  };
}

// Hook for using LLM with the game store integration
export function useLLMWithGameStore() {
  const llm = useLLM();
  const setStreaming = useGameStore((state) => state.setStreaming);
  const appendStreamingText = useGameStore((state) => state.appendStreamingText);
  const setChoices = useGameStore((state) => state.setChoices);
  const setGeneratingChoices = useGameStore((state) => state.setGeneratingChoices);

  // Send message with game store integration
  const sendMessageWithUI = useCallback(async (
    part: Part,
    personality: PartPersonality | null,
    relationship: Relationship | null,
    activeCommitments: Commitment[],
    recentMessages: ConversationMessage[],
    userMessage: string
  ): Promise<string> => {
    setStreaming(true, '');

    try {
      const response = await llm.sendMessageStreaming(
        part,
        personality,
        relationship,
        activeCommitments,
        recentMessages,
        userMessage,
        (chunk) => appendStreamingText(chunk)
      );

      setStreaming(false);

      // Generate choices
      setGeneratingChoices(true);
      const choices = await llm.getChoices(part, personality, relationship, response);
      setChoices(choices);

      return response;
    } catch (err) {
      setStreaming(false);
      throw err;
    }
  }, [llm, setStreaming, appendStreamingText, setChoices, setGeneratingChoices]);

  return {
    ...llm,
    sendMessageWithUI,
  };
}
