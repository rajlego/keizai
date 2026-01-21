import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { getAllHeroesByCategory, getSuggestedHeroes, requestHeroCommentary } from '../../services/writing/heroCommentary';
import { useWriting, useWritingActions } from '../../hooks/useWriting';
import { addCommentaryToWriting } from '../../sync/yjsProvider';
import type { HeroCategory, HeroCommentary } from '../../models/types';
import type { NotableHero } from '../../services/battle/heroGenerator';

// Maximum commentaries per entry
const MAX_COMMENTARIES = 50;

// Comment display modes
type CommentDisplayMode = 'sidebar' | 'inline' | 'margin' | 'minimal';

export function WritingView() {
  // All entries from Yjs
  const entries = useWriting();
  const { createEntry, updateContent, deleteEntry, markCommentaryHelpful } = useWritingActions();

  // Current entry selection
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Local state for editing
  const [localContent, setLocalContent] = useState('');
  const [commentaries, setCommentaries] = useState<HeroCommentary[]>([]);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestedHeroes, setSuggestedHeroes] = useState<NotableHero[]>([]);
  const [showAllHeroes, setShowAllHeroes] = useState(false);
  const [commentMode, setCommentMode] = useState<CommentDisplayMode>('sidebar');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const loadingRef = useRef<string | null>(null);
  const debounceTimeoutRef = useRef<number | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Ref to track selectedEntryId for auto-save (fixes race condition)
  const selectedEntryIdRef = useRef<string | null>(null);
  selectedEntryIdRef.current = selectedEntryId;

  const claudeApiKey = useSettingsStore((state) => state.claudeApiKey);
  const allHeroes = useMemo(() => getAllHeroesByCategory(), []);

  // Get current entry
  const currentEntry = useMemo(() => {
    if (!selectedEntryId) return null;
    return entries.find(e => e.id === selectedEntryId) || null;
  }, [entries, selectedEntryId]);

  // Load entry content when selection changes
  useEffect(() => {
    if (currentEntry) {
      setLocalContent(currentEntry.content);
      // Limit loaded commentaries to MAX_COMMENTARIES
      setCommentaries((currentEntry.commentaries || []).slice(0, MAX_COMMENTARIES));
      setIsDirty(false);
    } else if (!isCreatingNew) {
      setLocalContent('');
      setCommentaries([]);
      setIsDirty(false);
    }
  }, [currentEntry, isCreatingNew]);

  // Auto-save content changes (debounced) - uses ref to avoid race condition
  useEffect(() => {
    if (!selectedEntryIdRef.current || !localContent) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const entryIdToSave = selectedEntryIdRef.current;
    saveTimeoutRef.current = window.setTimeout(() => {
      // Use captured entryId, not current ref value
      updateContent(entryIdToSave, localContent);
      setIsDirty(false);
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [localContent, updateContent]);

  // Debounced suggestions update
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (localContent.length > 20) {
      debounceTimeoutRef.current = window.setTimeout(() => {
        setSuggestedHeroes(getSuggestedHeroes(localContent));
      }, 300);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [localContent]);

  // Auto-focus textarea
  useEffect(() => {
    if (selectedEntryId || isCreatingNew) {
      textareaRef.current?.focus();
    }
  }, [selectedEntryId, isCreatingNew]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCreatingNew) {
          if (isDirty && localContent.trim()) {
            if (!confirm('Discard unsaved entry?')) return;
          }
          setIsCreatingNew(false);
          setLocalContent('');
          setIsDirty(false);
        } else if (selectedEntryId) {
          setSelectedEntryId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreatingNew, isDirty, localContent, selectedEntryId]);

  // Cleanup AbortController on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Warn before closing tab with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isCreatingNew && isDirty && localContent.trim()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isCreatingNew, isDirty, localContent]);

  // Check for unsaved changes before switching entries
  const handleSelectEntry = useCallback((id: string) => {
    if (isCreatingNew && isDirty && localContent.trim()) {
      if (!confirm('You have unsaved work. Discard it?')) return;
    }
    setSelectedEntryId(id);
    setIsCreatingNew(false);
    setIsDirty(false);
  }, [isCreatingNew, isDirty, localContent]);

  // Create new entry mode
  const handleCreateEntry = useCallback(() => {
    if (isCreatingNew && isDirty && localContent.trim()) {
      if (!confirm('You have unsaved work. Discard it?')) return;
    }
    setIsCreatingNew(true);
    setSelectedEntryId(null);
    setLocalContent('');
    setCommentaries([]);
    setIsDirty(false);
  }, [isCreatingNew, isDirty, localContent]);

  // Save new entry
  const handleSaveNewEntry = useCallback(() => {
    if (!localContent.trim()) return;

    // Fix: trim the first line before using as title
    const title = localContent.split('\n')[0].trim().substring(0, 50) || 'Untitled';
    const newId = createEntry(title, localContent);
    setSelectedEntryId(newId);
    setIsCreatingNew(false);
    setIsDirty(false);
  }, [localContent, createEntry]);

  // Delete entry
  const handleDeleteEntry = useCallback((id: string) => {
    deleteEntry(id);
    if (selectedEntryId === id) {
      setSelectedEntryId(null);
      setLocalContent('');
      setCommentaries([]);
      setIsDirty(false);
    }
  }, [deleteEntry, selectedEntryId]);

  // Handle content change
  const handleContentChange = useCallback((newContent: string) => {
    setLocalContent(newContent);
    setIsDirty(true);
  }, []);

  // Request commentary from a hero
  const handleRequestCommentary = useCallback(async (hero: NotableHero) => {
    if (!claudeApiKey || !localContent.trim() || loadingRef.current) {
      if (!claudeApiKey) {
        setError('Please set your API key in Settings first');
      }
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    loadingRef.current = hero.name;
    setIsLoading(hero.name);
    setError(null);

    try {
      const commentary = await requestHeroCommentary(
        hero.name,
        'My Writing',
        localContent,
        claudeApiKey
      );

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      if (commentary) {
        // CRITICAL FIX: Persist to Yjs if we have an entry selected
        if (selectedEntryIdRef.current) {
          addCommentaryToWriting(selectedEntryIdRef.current, commentary);
        }

        // Update local state
        setCommentaries(prev => {
          const updated = [commentary, ...prev];
          return updated.slice(0, MAX_COMMENTARIES);
        });
      } else {
        setError('Failed to get commentary. Please try again.');
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      console.error('[WritingView] Error:', err);
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('402') || message.includes('credits') || message.includes('Insufficient')) {
        setError('OpenRouter: No credits. Add credits at openrouter.ai/settings/credits');
      } else if (message.includes('401') || message.includes('Unauthorized')) {
        setError('Invalid API key. Check Settings.');
      } else if (message.includes('network') || message.includes('fetch')) {
        setError('Network error. Check your connection.');
      } else if (message.includes('malformed') || message.includes('JSON')) {
        setError('Hero response was malformed. Please try again.');
      } else {
        setError(`Error: ${message}`);
      }
    } finally {
      loadingRef.current = null;
      setIsLoading(null);
      abortControllerRef.current = null;
    }
  }, [claudeApiKey, localContent]);

  // Mark commentary as helpful - CRITICAL FIX: persist to Yjs
  const handleMarkHelpful = useCallback((commentaryId: string, helpful: boolean) => {
    // Update local state
    setCommentaries(prev =>
      prev.map(c => c.id === commentaryId ? { ...c, helpful } : c)
    );

    // Persist to Yjs
    if (selectedEntryIdRef.current) {
      markCommentaryHelpful(selectedEntryIdRef.current, commentaryId, helpful);
    }
  }, [markCommentaryHelpful]);

  const wordCount = useMemo(() => {
    return localContent.trim().split(/\s+/).filter(w => w.length > 0).length;
  }, [localContent]);

  const displayHeroes = suggestedHeroes.length > 0 ? suggestedHeroes : getSuggestedHeroes('');

  // Render comment based on display mode
  const renderComments = () => {
    if (commentaries.length === 0) {
      return (
        <p className="text-[9px] text-[var(--color-pixel-text-dim)] text-center py-4">
          Click a hero to get their perspective
        </p>
      );
    }

    switch (commentMode) {
      case 'minimal':
        return (
          <div className="space-y-2">
            {commentaries.map(c => (
              <div key={c.id} className="p-2 border-l-2 border-[var(--color-pixel-accent)]">
                <span className="text-[9px] text-[var(--color-pixel-accent)] font-bold">{c.heroName}: </span>
                <span className="text-[9px] text-[var(--color-pixel-text)]">{c.keyReflection}</span>
              </div>
            ))}
          </div>
        );

      case 'margin':
        return (
          <div className="space-y-3">
            {commentaries.map(c => (
              <div key={c.id} className="relative pl-3 border-l-2 border-[var(--color-pixel-accent)]">
                <div className="absolute -left-1 top-0 w-2 h-2 rounded-full bg-[var(--color-pixel-accent)]" />
                <span className="text-[8px] text-[var(--color-pixel-accent)]">{c.heroName}</span>
                <p className="text-[9px] text-[var(--color-pixel-text)] mt-1">{c.keyReflection}</p>
                {c.questionToConsider && (
                  <p className="text-[8px] text-[var(--color-pixel-warning)] mt-1 italic">
                    → {c.questionToConsider}
                  </p>
                )}
              </div>
            ))}
          </div>
        );

      case 'inline':
        return (
          <div className="space-y-4">
            {commentaries.map(c => (
              <div key={c.id} className="bg-[var(--color-pixel-accent)] bg-opacity-10 p-3 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-pixel-accent)] flex items-center justify-center">
                    <span className="text-[8px] text-[var(--color-pixel-bg)]">
                      {c.heroName.charAt(0)}
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--color-pixel-accent)] font-bold">
                    {c.heroName}
                  </span>
                </div>
                <p className="text-[9px] text-[var(--color-pixel-text)] whitespace-pre-wrap">
                  {c.commentary}
                </p>
                <div className="mt-2 p-2 bg-[var(--color-pixel-surface)] rounded">
                  <p className="text-[9px] text-[var(--color-pixel-accent)] font-medium">
                    💡 {c.keyReflection}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'sidebar':
      default:
        return (
          <div className="space-y-3">
            {commentaries.map(c => (
              <div
                key={c.id}
                className="bg-[var(--color-pixel-bg)] border border-[var(--color-pixel-secondary)] p-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-[var(--color-pixel-accent)] font-bold">
                    {c.heroName}
                  </span>
                  <span className="text-[7px] text-[var(--color-pixel-text-dim)]">
                    {c.heroCategory}
                  </span>
                </div>

                {c.highlightedQuote && (
                  <div className="text-[8px] text-[var(--color-pixel-text-dim)] italic border-l-2 border-[var(--color-pixel-accent)] pl-2 mb-2">
                    "{c.highlightedQuote}"
                  </div>
                )}

                <p className="text-[9px] text-[var(--color-pixel-text)] mb-2 whitespace-pre-wrap">
                  {c.commentary}
                </p>

                <div className="bg-[var(--color-pixel-surface)] p-2 mb-2">
                  <p className="text-[9px] text-[var(--color-pixel-accent)]">
                    {c.keyReflection}
                  </p>
                </div>

                {c.questionToConsider && (
                  <p className="text-[8px] text-[var(--color-pixel-warning)] italic mb-2">
                    To consider: {c.questionToConsider}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    aria-label="Mark as helpful"
                    onClick={() => handleMarkHelpful(c.id, true)}
                    className={`text-[8px] px-2 py-1 border ${
                      c.helpful === true
                        ? 'border-[var(--color-pixel-success)] text-[var(--color-pixel-success)]'
                        : 'border-[var(--color-pixel-secondary)] text-[var(--color-pixel-text-dim)]'
                    }`}
                  >
                    ✓
                  </button>
                  <button
                    aria-label="Mark as not helpful"
                    onClick={() => handleMarkHelpful(c.id, false)}
                    className={`text-[8px] px-2 py-1 border ${
                      c.helpful === false
                        ? 'border-[var(--color-pixel-error)] text-[var(--color-pixel-error)]'
                        : 'border-[var(--color-pixel-secondary)] text-[var(--color-pixel-text-dim)]'
                    }`}
                  >
                    ✗
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="h-full flex">
      {/* Entry list sidebar */}
      <div className="w-48 flex-shrink-0 border-r-2 border-[var(--color-pixel-secondary)] bg-[var(--color-pixel-surface)] flex flex-col overflow-hidden">
        <div className="p-2 border-b border-[var(--color-pixel-secondary)]">
          <button
            onClick={handleCreateEntry}
            className="w-full px-2 py-1 text-[9px] bg-[var(--color-pixel-accent)] text-[var(--color-pixel-bg)] hover:opacity-90"
          >
            + New Entry
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {entries.length === 0 ? (
            <p className="text-[8px] text-[var(--color-pixel-text-dim)] text-center py-4">
              No entries yet
            </p>
          ) : (
            entries.map(entry => (
              <div
                key={entry.id}
                onClick={() => handleSelectEntry(entry.id)}
                className={`p-2 cursor-pointer border-b border-[var(--color-pixel-secondary)] ${
                  selectedEntryId === entry.id
                    ? 'bg-[var(--color-pixel-accent)] bg-opacity-20'
                    : 'hover:bg-[var(--color-pixel-bg)]'
                }`}
              >
                <p className="text-[9px] text-[var(--color-pixel-text)] truncate">
                  {entry.title || 'Untitled'}
                </p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[7px] text-[var(--color-pixel-text-dim)]">
                    {entry.wordCount} words
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEntry(entry.id);
                    }}
                    className="text-[7px] text-[var(--color-pixel-error)] hover:underline"
                  >
                    del
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main writing area */}
      <div className="flex-1 flex flex-col p-4">
        {!selectedEntryId && !isCreatingNew ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[11px] text-[var(--color-pixel-text-dim)] mb-4">
                Select an entry or create a new one
              </p>
              <button
                onClick={handleCreateEntry}
                className="px-4 py-2 text-[10px] bg-[var(--color-pixel-accent)] text-[var(--color-pixel-bg)]"
              >
                Start Writing
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] text-[var(--color-pixel-text-dim)]">
                {wordCount} words
                {isDirty && <span className="ml-1 text-[var(--color-pixel-warning)]">•</span>}
                {isCreatingNew && (
                  <button
                    onClick={handleSaveNewEntry}
                    disabled={!localContent.trim()}
                    className="ml-2 text-[var(--color-pixel-success)] hover:underline disabled:opacity-50"
                  >
                    save
                  </button>
                )}
              </span>
              {!claudeApiKey && (
                <span className="text-[9px] text-[var(--color-pixel-warning)]">
                  Set API key in Settings
                </span>
              )}
            </div>

            <textarea
              ref={textareaRef}
              value={localContent}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Just start writing..."
              className="flex-1 w-full bg-[var(--color-pixel-bg)] text-[var(--color-pixel-text)] border-2 border-[var(--color-pixel-secondary)] p-4 text-[11px] leading-relaxed resize-none focus:outline-none focus:border-[var(--color-pixel-accent)]"
              style={{ fontFamily: 'inherit' }}
            />
          </>
        )}
      </div>

      {/* Hero/Comments panel */}
      <div className="w-72 flex-shrink-0 border-l-2 border-[var(--color-pixel-secondary)] bg-[var(--color-pixel-surface)] flex flex-col overflow-hidden">
        {/* Error display */}
        {error && (
          <div className="p-2 bg-[var(--color-pixel-error)] bg-opacity-20 border-b border-[var(--color-pixel-error)]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-[var(--color-pixel-error)]">{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-[9px] text-[var(--color-pixel-error)] hover:underline"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Comment display mode selector */}
        <div className="p-2 border-b border-[var(--color-pixel-secondary)]">
          <div className="flex gap-1">
            {(['sidebar', 'inline', 'margin', 'minimal'] as CommentDisplayMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setCommentMode(mode)}
                className={`px-2 py-1 text-[7px] border ${
                  commentMode === mode
                    ? 'border-[var(--color-pixel-accent)] text-[var(--color-pixel-accent)]'
                    : 'border-[var(--color-pixel-secondary)] text-[var(--color-pixel-text-dim)]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Hero selector */}
        <div className="p-2 border-b border-[var(--color-pixel-secondary)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] text-[var(--color-pixel-accent)]">Ask a Hero</h3>
            <button
              onClick={() => setShowAllHeroes(!showAllHeroes)}
              className="text-[8px] text-[var(--color-pixel-text-dim)] hover:text-[var(--color-pixel-text)]"
            >
              {showAllHeroes ? 'Suggested' : 'All'}
            </button>
          </div>

          {showAllHeroes ? (
            <div className="max-h-32 overflow-y-auto space-y-2">
              {(Object.keys(allHeroes) as HeroCategory[]).map(category => (
                <div key={category}>
                  <p className="text-[7px] text-[var(--color-pixel-text-dim)] uppercase mb-1">
                    {category}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {allHeroes[category].map(hero => (
                      <button
                        key={hero.name}
                        onClick={() => handleRequestCommentary(hero)}
                        disabled={isLoading !== null || !localContent.trim()}
                        className="px-1 py-0.5 text-[7px] bg-[var(--color-pixel-bg)] border border-[var(--color-pixel-secondary)] hover:border-[var(--color-pixel-accent)] disabled:opacity-50"
                        title={hero.description}
                      >
                        {isLoading === hero.name ? '...' : hero.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {displayHeroes.map(hero => (
                <button
                  key={hero.name}
                  onClick={() => handleRequestCommentary(hero)}
                  disabled={isLoading !== null || !localContent.trim()}
                  className="px-2 py-1 text-[8px] bg-[var(--color-pixel-bg)] border border-[var(--color-pixel-secondary)] hover:border-[var(--color-pixel-accent)] disabled:opacity-50"
                  title={hero.description}
                >
                  {isLoading === hero.name ? '...' : hero.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Commentaries */}
        <div className="flex-1 overflow-y-auto p-2">
          {renderComments()}
        </div>
      </div>
    </div>
  );
}
