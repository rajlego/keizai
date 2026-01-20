import { useState, useEffect, useCallback } from 'react';
import type { Relationship } from '../models/types';
import { RELATIONSHIP_TITLES, RELATIONSHIP_XP_THRESHOLDS } from '../models/types';
import {
  getAllRelationships,
  getRelationship,
  setRelationship,
  updateRelationship,
  addRelationshipXP,
  onRelationshipsChange,
} from '../sync/yjsProvider';

// Generate unique ID
function generateId(): string {
  return 'rel_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// Calculate level from XP
function calculateLevel(experience: number): number {
  for (let level = 10; level >= 1; level--) {
    if (experience >= RELATIONSHIP_XP_THRESHOLDS[level]) {
      return level;
    }
  }
  return 1;
}

// Get title for level
function getTitleForLevel(level: number): string {
  return RELATIONSHIP_TITLES[level] ?? 'Unknown';
}

// Hook for all relationships
export function useRelationships() {
  const [relationships, setRelationships] = useState<Relationship[]>(() => getAllRelationships());

  useEffect(() => {
    const unsubscribe = onRelationshipsChange(setRelationships);
    return unsubscribe;
  }, []);

  return relationships;
}

// Hook for a specific part's relationship
export function useRelationship(partId: string | null) {
  const [relationship, setRelationshipState] = useState<Relationship | null>(() =>
    partId ? getRelationship(partId) ?? null : null
  );

  useEffect(() => {
    if (!partId) {
      setRelationshipState(null);
      return;
    }

    const unsubscribe = onRelationshipsChange((relationships) => {
      const found = relationships.find(r => r.partId === partId);
      setRelationshipState(found ?? null);
    });

    return unsubscribe;
  }, [partId]);

  return relationship;
}

// Hook for relationship with computed values
export function useRelationshipWithProgress(partId: string | null) {
  const relationship = useRelationship(partId);

  if (!relationship) {
    return null;
  }

  const currentLevel = calculateLevel(relationship.experience);
  const currentThreshold = RELATIONSHIP_XP_THRESHOLDS[currentLevel];
  const nextThreshold = RELATIONSHIP_XP_THRESHOLDS[currentLevel + 1] ?? currentThreshold;
  const xpInCurrentLevel = relationship.experience - currentThreshold;
  const xpNeededForNext = nextThreshold - currentThreshold;
  const progress = currentLevel >= 10 ? 100 : (xpInCurrentLevel / xpNeededForNext) * 100;

  return {
    ...relationship,
    currentLevel,
    title: getTitleForLevel(currentLevel),
    progress,
    xpToNextLevel: currentLevel >= 10 ? 0 : xpNeededForNext - xpInCurrentLevel,
    isMaxLevel: currentLevel >= 10,
  };
}

// Hook for relationship actions
export function useRelationshipActions() {
  const initializeRelationship = useCallback((partId: string): Relationship => {
    const now = new Date().toISOString();
    const relationship: Relationship = {
      id: generateId(),
      partId,
      level: 1,
      experience: 0,
      title: getTitleForLevel(1),
      unlockedAbilities: [],
      flags: {},
      lastInteractionAt: now,
    };

    setRelationship(relationship);
    return relationship;
  }, []);

  const getOrCreateRelationship = useCallback((partId: string): Relationship => {
    const existing = getRelationship(partId);
    if (existing) return existing;
    return initializeRelationship(partId);
  }, [initializeRelationship]);

  const grantXP = useCallback((partId: string, amount: number) => {
    // Ensure relationship exists
    getOrCreateRelationship(partId);

    // Add XP
    addRelationshipXP(partId, amount);

    // Check for level up and update title
    const updated = getRelationship(partId);
    if (updated) {
      const newLevel = calculateLevel(updated.experience);
      if (newLevel !== updated.level) {
        updateRelationship(partId, {
          level: newLevel,
          title: getTitleForLevel(newLevel),
        });
      }
    }
  }, [getOrCreateRelationship]);

  const setFlag = useCallback((partId: string, flag: string, value: boolean = true) => {
    const existing = getRelationship(partId);
    if (!existing) return;

    updateRelationship(partId, {
      flags: {
        ...existing.flags,
        [flag]: value,
      },
    });
  }, []);

  const unlockAbility = useCallback((partId: string, ability: string) => {
    const existing = getRelationship(partId);
    if (!existing) return;

    if (!existing.unlockedAbilities.includes(ability)) {
      updateRelationship(partId, {
        unlockedAbilities: [...existing.unlockedAbilities, ability],
      });
    }
  }, []);

  return {
    initializeRelationship,
    getOrCreateRelationship,
    grantXP,
    setFlag,
    unlockAbility,
  };
}

// XP rewards for different actions
export const RELATIONSHIP_XP_REWARDS = {
  conversation: 10,
  deepConversation: 25,
  completedCommitment: 50,
  failedCommitment: -20,
  loanApproved: 15,
  loanRepaid: 30,
  debate: 20,
  helpedPart: 35,
} as const;
