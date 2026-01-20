import { useState, useEffect, useCallback } from 'react';
import type { GameState, PartGameState, PartMood, PendingRequest } from '../models/types';
import {
  getGameState,
  updateGameState,
  updatePlayerPosition,
  updatePartGameState,
  setActiveConversation,
  onGameStateChange,
} from '../sync/yjsProvider';
import { useParts } from './useParts';

// Hook for full game state
export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(() => getGameState());

  useEffect(() => {
    const unsubscribe = onGameStateChange(setGameState);
    return unsubscribe;
  }, []);

  return gameState;
}

// Hook for player state only
export function usePlayerState() {
  const gameState = useGameState();
  return gameState.playerState;
}

// Hook for all part game states
export function usePartGameStates() {
  const gameState = useGameState();
  return gameState.partStates;
}

// Hook for a specific part's game state
export function usePartGameState(partId: string | null) {
  const partStates = usePartGameStates();

  if (!partId) return null;
  return partStates.find(ps => ps.partId === partId) ?? null;
}

// Hook for game state with parts data combined
export function useGameStateWithParts() {
  const gameState = useGameState();
  const parts = useParts();

  // Combine part data with game state
  const partsWithState = parts.map(part => {
    const partState = gameState.partStates.find(ps => ps.partId === part.id);
    return {
      ...part,
      gameState: partState ?? {
        partId: part.id,
        position: { x: Math.random() * 80 + 10, y: Math.random() * 60 + 20 },
        mood: 'neutral' as PartMood,
        expression: 'default',
        isAvailable: true,
      },
    };
  });

  return {
    ...gameState,
    partsWithState,
  };
}

// Hook for game state actions
export function useGameStateActions() {
  const movePlayer = useCallback((x: number, y: number) => {
    updatePlayerPosition(x, y);
  }, []);

  const setPlayerScene = useCallback((scene: string) => {
    const current = getGameState();
    updateGameState({
      playerState: {
        ...current.playerState,
        currentScene: scene,
      },
    });
  }, []);

  const openConversation = useCallback((conversationId: string) => {
    setActiveConversation(conversationId);
  }, []);

  const closeConversation = useCallback(() => {
    setActiveConversation(null);
  }, []);

  const setPartMood = useCallback((partId: string, mood: PartMood) => {
    updatePartGameState(partId, { mood });
  }, []);

  const setPartExpression = useCallback((partId: string, expression: string) => {
    updatePartGameState(partId, { expression });
  }, []);

  const setPartAvailable = useCallback((partId: string, isAvailable: boolean) => {
    updatePartGameState(partId, { isAvailable });
  }, []);

  const setPartPosition = useCallback((partId: string, x: number, y: number) => {
    updatePartGameState(partId, { position: { x, y } });
  }, []);

  const setPartPendingRequest = useCallback((partId: string, request: PendingRequest | undefined) => {
    updatePartGameState(partId, { pendingRequest: request });
  }, []);

  const initializePartStates = useCallback((partIds: string[]) => {
    const current = getGameState();
    const existingIds = new Set(current.partStates.map(ps => ps.partId));

    // Only initialize parts that don't have state yet
    const newPartIds = partIds.filter(id => !existingIds.has(id));

    if (newPartIds.length === 0) return;

    // Spread parts in a grid pattern
    const cols = Math.ceil(Math.sqrt(newPartIds.length));
    const newStates: PartGameState[] = newPartIds.map((partId, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      return {
        partId,
        position: {
          x: 20 + (col * 25) + (Math.random() * 10 - 5),
          y: 25 + (row * 25) + (Math.random() * 10 - 5),
        },
        mood: 'neutral' as PartMood,
        expression: 'default',
        isAvailable: true,
      };
    });

    updateGameState({
      partStates: [...current.partStates, ...newStates],
    });
  }, []);

  return {
    movePlayer,
    setPlayerScene,
    openConversation,
    closeConversation,
    setPartMood,
    setPartExpression,
    setPartAvailable,
    setPartPosition,
    setPartPendingRequest,
    initializePartStates,
  };
}
