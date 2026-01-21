import { useState, useEffect, useCallback } from 'react';
import type { WritingEntry, HeroCommentary, HeroCategory } from '../models/types';
import {
  getAllWritingEntries,
  getWritingEntry,
  addWritingEntry,
  updateWritingEntry,
  addCommentaryToWriting,
  updateCommentaryFeedback,
  deleteWritingEntry,
  onWritingChange,
} from '../sync/yjsProvider';

// Generate unique ID
function generateId(): string {
  return 'wr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// Hook for all writing entries
export function useWriting(): WritingEntry[] {
  const [entries, setEntries] = useState<WritingEntry[]>(() => getAllWritingEntries());

  useEffect(() => {
    const unsubscribe = onWritingChange(setEntries);
    return unsubscribe;
  }, []);

  return entries;
}

// Hook for a specific writing entry
export function useWritingEntry(entryId: string | null): WritingEntry | null {
  const [entry, setEntry] = useState<WritingEntry | null>(() =>
    entryId ? getWritingEntry(entryId) ?? null : null
  );

  useEffect(() => {
    if (!entryId) {
      setEntry(null);
      return;
    }

    const unsubscribe = onWritingChange((entries) => {
      const found = entries.find(e => e.id === entryId);
      setEntry(found ?? null);
    });

    return unsubscribe;
  }, [entryId]);

  return entry;
}

// Hook for writing actions
export function useWritingActions() {
  // Create a new writing entry
  const createEntry = useCallback((title: string, content: string = '', mood?: string, tags?: string[]): string => {
    const now = new Date().toISOString();
    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;

    const entry: WritingEntry = {
      id: generateId(),
      title,
      content,
      wordCount,
      mood,
      tags,
      commentaries: [],
      createdAt: now,
      updatedAt: now,
    };

    addWritingEntry(entry);
    return entry.id;
  }, []);

  // Update entry content
  const updateContent = useCallback((entryId: string, content: string) => {
    updateWritingEntry(entryId, { content });
  }, []);

  // Update entry title
  const updateTitle = useCallback((entryId: string, title: string) => {
    updateWritingEntry(entryId, { title });
  }, []);

  // Update entry mood
  const updateMood = useCallback((entryId: string, mood: string | undefined) => {
    updateWritingEntry(entryId, { mood });
  }, []);

  // Update entry tags
  const updateTags = useCallback((entryId: string, tags: string[]) => {
    updateWritingEntry(entryId, { tags });
  }, []);

  // Add hero commentary
  const addCommentary = useCallback((
    entryId: string,
    heroName: string,
    heroCategory: HeroCategory,
    commentary: string,
    keyReflection: string,
    highlightedQuote?: string,
    questionToConsider?: string
  ): string => {
    const commentaryId = generateId();
    const heroCommentary: HeroCommentary = {
      id: commentaryId,
      heroName,
      heroCategory,
      commentary,
      keyReflection,
      highlightedQuote,
      questionToConsider,
      requestedAt: new Date().toISOString(),
    };

    addCommentaryToWriting(entryId, heroCommentary);
    return commentaryId;
  }, []);

  // Mark commentary as helpful/not helpful
  const markCommentaryHelpful = useCallback((entryId: string, commentaryId: string, helpful: boolean) => {
    updateCommentaryFeedback(entryId, commentaryId, helpful);
  }, []);

  // Delete an entry
  const deleteEntry = useCallback((entryId: string) => {
    deleteWritingEntry(entryId);
  }, []);

  return {
    createEntry,
    updateContent,
    updateTitle,
    updateMood,
    updateTags,
    addCommentary,
    markCommentaryHelpful,
    deleteEntry,
  };
}
