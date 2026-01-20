import { useState } from 'react';
import type { Part, PartPersonality } from '../../models/types';
import { CharacterPortrait } from '../dialogue/CharacterPortrait';

// Common IFS part traits
const SUGGESTED_TRAITS = [
  'protective', 'anxious', 'perfectionist', 'nurturing', 'critical',
  'playful', 'cautious', 'rebellious', 'pleasing', 'controlling',
  'creative', 'logical', 'emotional', 'withdrawn', 'bold',
  'curious', 'fearful', 'hopeful', 'skeptical', 'trusting',
];

interface PersonalityEditorProps {
  part: Part;
  personality?: PartPersonality | null;
  onSave: (personality: Omit<PartPersonality, 'partId' | 'createdAt' | 'updatedAt'>) => void;
  onGenerateAI?: () => Promise<{ traits: string[]; speechStyle: string; coreNeed: string }>;
  onClose: () => void;
  isGenerating?: boolean;
}

export function PersonalityEditor({
  part,
  personality,
  onSave,
  onGenerateAI,
  onClose,
  isGenerating = false,
}: PersonalityEditorProps) {
  const [traits, setTraits] = useState<string[]>(personality?.traits ?? []);
  const [speechStyle, setSpeechStyle] = useState(personality?.speechStyle ?? '');
  const [coreNeed, setCoreNeed] = useState(personality?.coreNeed ?? '');
  const [customNotes, setCustomNotes] = useState(personality?.customNotes ?? '');
  const [voicePitch, setVoicePitch] = useState<'low' | 'medium' | 'high'>(personality?.voicePitch ?? 'medium');
  const [customTrait, setCustomTrait] = useState('');

  const handleAddTrait = (trait: string) => {
    if (trait && !traits.includes(trait) && traits.length < 6) {
      setTraits([...traits, trait.toLowerCase()]);
    }
  };

  const handleRemoveTrait = (trait: string) => {
    setTraits(traits.filter(t => t !== trait));
  };

  const handleAddCustomTrait = () => {
    if (customTrait.trim()) {
      handleAddTrait(customTrait.trim());
      setCustomTrait('');
    }
  };

  const handleGenerateAI = async () => {
    if (onGenerateAI) {
      try {
        const generated = await onGenerateAI();
        setTraits(generated.traits.slice(0, 6));
        setSpeechStyle(generated.speechStyle);
        setCoreNeed(generated.coreNeed);
      } catch (error) {
        console.error('Failed to generate personality:', error);
      }
    }
  };

  const handleSave = () => {
    onSave({
      traits,
      speechStyle,
      coreNeed,
      customNotes,
      voicePitch,
    });
  };

  const hasChanges = () => {
    if (!personality) return traits.length > 0 || speechStyle || coreNeed || customNotes;
    return (
      JSON.stringify(traits) !== JSON.stringify(personality.traits) ||
      speechStyle !== personality.speechStyle ||
      coreNeed !== personality.coreNeed ||
      customNotes !== personality.customNotes ||
      voicePitch !== personality.voicePitch
    );
  };

  return (
    <div className="bg-[var(--color-pixel-surface)] border-4 border-[var(--color-pixel-secondary)] max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b-2 border-[var(--color-pixel-secondary)] bg-[var(--color-pixel-bg)]">
        <div className="flex items-center gap-3">
          <CharacterPortrait part={part} mood="neutral" size="sm" />
          <div>
            <h3 className="text-[14px] text-[var(--color-pixel-accent)] font-bold">
              {part.name}'s Personality
            </h3>
            <div className="text-[9px] text-[var(--color-pixel-text-dim)]">
              Define how this part thinks and speaks
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[var(--color-pixel-text-dim)] hover:text-[var(--color-pixel-text)] text-lg"
        >
          ×
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* AI Generate button */}
        {onGenerateAI && (
          <button
            onClick={handleGenerateAI}
            disabled={isGenerating}
            className="w-full px-3 py-2 text-[10px] bg-[var(--color-pixel-primary)] text-white border-2 border-[var(--color-pixel-primary)] hover:brightness-110 disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : '✨ Auto-Generate with AI'}
          </button>
        )}

        {/* Traits */}
        <div>
          <label className="block text-[10px] text-[var(--color-pixel-text-dim)] mb-2">
            Personality Traits (up to 6)
          </label>

          {/* Selected traits */}
          <div className="flex flex-wrap gap-1 mb-2 min-h-8">
            {traits.map((trait) => (
              <span
                key={trait}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] bg-[var(--color-pixel-accent)] text-black"
              >
                {trait}
                <button
                  onClick={() => handleRemoveTrait(trait)}
                  className="text-black/60 hover:text-black"
                >
                  ×
                </button>
              </span>
            ))}
            {traits.length === 0 && (
              <span className="text-[9px] text-[var(--color-pixel-text-dim)]">
                No traits selected
              </span>
            )}
          </div>

          {/* Suggested traits */}
          <div className="flex flex-wrap gap-1 mb-2">
            {SUGGESTED_TRAITS.filter(t => !traits.includes(t)).slice(0, 10).map((trait) => (
              <button
                key={trait}
                onClick={() => handleAddTrait(trait)}
                disabled={traits.length >= 6}
                className="px-2 py-0.5 text-[8px] bg-transparent text-[var(--color-pixel-text-dim)] border border-[#888] hover:border-[var(--color-pixel-accent)] hover:text-[var(--color-pixel-text)] disabled:opacity-30"
              >
                + {trait}
              </button>
            ))}
          </div>

          {/* Custom trait input */}
          <div className="flex gap-1">
            <input
              type="text"
              value={customTrait}
              onChange={(e) => setCustomTrait(e.target.value)}
              placeholder="Add custom trait..."
              className="flex-1 px-2 py-1 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[10px]"
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTrait()}
            />
            <button
              onClick={handleAddCustomTrait}
              disabled={!customTrait.trim() || traits.length >= 6}
              className="px-2 py-1 text-[9px] bg-[var(--color-pixel-secondary)] text-[var(--color-pixel-text)] border-2 border-[var(--color-pixel-secondary)] disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>

        {/* Speech Style */}
        <div>
          <label className="block text-[10px] text-[var(--color-pixel-text-dim)] mb-1">
            Speech Style
          </label>
          <textarea
            value={speechStyle}
            onChange={(e) => setSpeechStyle(e.target.value)}
            placeholder="e.g., speaks in short, nervous sentences with lots of qualifiers..."
            className="w-full px-2 py-1 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[10px] h-16 resize-none"
          />
        </div>

        {/* Core Need */}
        <div>
          <label className="block text-[10px] text-[var(--color-pixel-text-dim)] mb-1">
            Core Need
          </label>
          <input
            type="text"
            value={coreNeed}
            onChange={(e) => setCoreNeed(e.target.value)}
            placeholder="e.g., needs to feel safe and in control..."
            className="w-full px-2 py-1 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[10px]"
          />
        </div>

        {/* Voice Pitch (for future TTS) */}
        <div>
          <label className="block text-[10px] text-[var(--color-pixel-text-dim)] mb-1">
            Voice Pitch (for future TTS)
          </label>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map((pitch) => (
              <button
                key={pitch}
                onClick={() => setVoicePitch(pitch)}
                className={`
                  px-3 py-1 text-[9px] border-2 transition-colors
                  ${voicePitch === pitch
                    ? 'bg-[var(--color-pixel-accent)] border-[var(--color-pixel-accent)] text-black'
                    : 'bg-transparent border-[#888] text-[var(--color-pixel-text-dim)] hover:border-[var(--color-pixel-accent)]'
                  }
                `}
              >
                {pitch}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Notes */}
        <div>
          <label className="block text-[10px] text-[var(--color-pixel-text-dim)] mb-1">
            Custom Notes (for LLM context)
          </label>
          <textarea
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            placeholder="Any additional context about this part's backstory, triggers, or behaviors..."
            className="w-full px-2 py-1 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[10px] h-20 resize-none"
          />
        </div>

        {/* Preview */}
        <div className="p-2 bg-[var(--color-pixel-bg)] border border-[var(--color-pixel-secondary)]">
          <div className="text-[9px] text-[var(--color-pixel-text-dim)] mb-1">Preview:</div>
          <div className="text-[10px] text-[var(--color-pixel-text)]">
            <span className="text-[var(--color-pixel-accent)]">{part.name}</span> is{' '}
            {traits.length > 0 ? traits.join(', ') : 'undefined'}.{' '}
            {speechStyle && `They ${speechStyle}.`}{' '}
            {coreNeed && `Their core need is ${coreNeed}.`}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 border-t-2 border-[var(--color-pixel-secondary)] flex gap-2 justify-end">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-[10px] bg-transparent text-[var(--color-pixel-text)] border-2 border-[#888] hover:border-[var(--color-pixel-accent)]"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges()}
          className="px-3 py-1.5 text-[10px] bg-[var(--color-pixel-accent)] text-black border-2 border-[var(--color-pixel-accent)] hover:brightness-110 disabled:opacity-50"
        >
          Save Personality
        </button>
      </div>
    </div>
  );
}
