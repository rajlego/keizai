import { useState, useEffect, useCallback } from 'react';
import type { PartPersonality } from '../models/types';
import {
  getAllPersonalities,
  getPersonality,
  setPersonality,
  updatePersonality,
  onPersonalitiesChange,
} from '../sync/yjsProvider';

// Hook for all personalities
export function usePersonalities() {
  const [personalities, setPersonalities] = useState<PartPersonality[]>(() => getAllPersonalities());

  useEffect(() => {
    const unsubscribe = onPersonalitiesChange(setPersonalities);
    return unsubscribe;
  }, []);

  return personalities;
}

// Hook for a specific part's personality
export function usePartPersonality(partId: string | null) {
  const [personality, setPersonalityState] = useState<PartPersonality | null>(() =>
    partId ? getPersonality(partId) ?? null : null
  );

  useEffect(() => {
    if (!partId) {
      setPersonalityState(null);
      return;
    }

    const unsubscribe = onPersonalitiesChange((personalities) => {
      const found = personalities.find(p => p.partId === partId);
      setPersonalityState(found ?? null);
    });

    return unsubscribe;
  }, [partId]);

  return personality;
}

// Hook for personality actions
export function usePersonalityActions() {
  const createPersonality = useCallback((
    partId: string,
    traits: string[] = [],
    speechStyle: string = '',
    coreNeed: string = '',
    customNotes: string = ''
  ): PartPersonality => {
    const now = new Date().toISOString();
    const personality: PartPersonality = {
      partId,
      traits,
      speechStyle,
      coreNeed,
      customNotes,
      createdAt: now,
      updatedAt: now,
    };

    setPersonality(personality);
    return personality;
  }, []);

  const updatePartPersonality = useCallback((
    partId: string,
    updates: Partial<Omit<PartPersonality, 'partId' | 'createdAt' | 'updatedAt'>>
  ) => {
    updatePersonality(partId, updates);
  }, []);

  const addTrait = useCallback((partId: string, trait: string) => {
    const existing = getPersonality(partId);
    if (!existing) return;

    if (!existing.traits.includes(trait)) {
      updatePersonality(partId, {
        traits: [...existing.traits, trait],
      });
    }
  }, []);

  const removeTrait = useCallback((partId: string, trait: string) => {
    const existing = getPersonality(partId);
    if (!existing) return;

    updatePersonality(partId, {
      traits: existing.traits.filter(t => t !== trait),
    });
  }, []);

  return {
    createPersonality,
    updatePartPersonality,
    addTrait,
    removeTrait,
  };
}

// Common personality traits for IFS parts
export const COMMON_TRAITS = [
  // Protector traits
  'protective',
  'vigilant',
  'controlling',
  'perfectionist',
  'critical',
  'anxious',
  'worried',
  'cautious',

  // Exile traits
  'vulnerable',
  'sad',
  'lonely',
  'ashamed',
  'scared',
  'hurt',
  'abandoned',
  'worthless',

  // Firefighter traits
  'impulsive',
  'addictive',
  'rebellious',
  'distracting',
  'numbing',
  'escapist',

  // Positive traits
  'caring',
  'nurturing',
  'creative',
  'playful',
  'curious',
  'wise',
  'compassionate',
  'brave',
  'determined',
  'hopeful',
] as const;

// Common speech styles
export const COMMON_SPEECH_STYLES = [
  'speaks in short, nervous sentences',
  'uses formal, precise language',
  'talks quickly and excitedly',
  'speaks softly and hesitantly',
  'uses dramatic, emotional language',
  'communicates through questions',
  'speaks with authority and confidence',
  'uses humor to deflect',
  'talks in metaphors and imagery',
  'is direct and to the point',
] as const;

// Common core needs
export const COMMON_CORE_NEEDS = [
  'needs to feel safe and protected',
  'needs to be seen and validated',
  'needs to feel in control',
  'needs connection and belonging',
  'needs to express creativity',
  'needs rest and relaxation',
  'needs achievement and success',
  'needs freedom and autonomy',
  'needs to be heard and understood',
  'needs to help and nurture others',
] as const;
