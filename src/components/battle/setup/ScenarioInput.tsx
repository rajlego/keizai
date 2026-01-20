import { useState } from 'react';
import type { Part, PartPersonality } from '../../../models/types';
import { CharacterPortrait } from '../../dialogue/CharacterPortrait';

interface ScenarioInputProps {
  parts: Array<{ part: Part; personality: PartPersonality | null }>;
  onSubmit: (scenario: string, selectedPartIds: string[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Example scenarios to inspire users
const EXAMPLE_SCENARIOS = [
  "I'm struggling with perfectionism - nothing I do feels good enough.",
  "I keep procrastinating on important tasks and beating myself up about it.",
  "I'm anxious about an upcoming presentation and can't stop worrying.",
  "I'm having trouble setting boundaries with someone in my life.",
  "I feel stuck between wanting to change and fear of the unknown.",
];

export function ScenarioInput({
  parts,
  onSubmit,
  onCancel,
  isLoading = false,
}: ScenarioInputProps) {
  const [scenario, setScenario] = useState('');
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>(
    parts.slice(0, 2).map(p => p.part.id) // Pre-select first 2 parts
  );

  const togglePart = (partId: string) => {
    setSelectedPartIds(prev =>
      prev.includes(partId)
        ? prev.filter(id => id !== partId)
        : [...prev, partId]
    );
  };

  const handleSubmit = () => {
    if (scenario.trim() && selectedPartIds.length > 0) {
      onSubmit(scenario.trim(), selectedPartIds);
    }
  };

  const useExample = (example: string) => {
    setScenario(example);
  };

  return (
    <div className="bg-[var(--color-pixel-surface)] border-4 border-[var(--color-pixel-secondary)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="p-4 border-b-2 border-[var(--color-pixel-secondary)] bg-[var(--color-pixel-bg)]">
        <h2 className="text-[16px] text-[var(--color-pixel-accent)] font-bold">
          Begin a Boss Battle
        </h2>
        <p className="text-[10px] text-[var(--color-pixel-text-dim)] mt-1">
          Describe a challenge you're facing. We'll create a villain representing this inner conflict.
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Scenario Input */}
        <div>
          <label className="block text-[11px] text-[var(--color-pixel-text)] mb-2">
            What challenge are you facing?
          </label>
          <textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="Describe the internal struggle you want to work through..."
            className="w-full h-32 px-3 py-2 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[11px] resize-none focus:border-[var(--color-pixel-accent)] outline-none"
            disabled={isLoading}
          />
        </div>

        {/* Example Scenarios */}
        <div>
          <label className="block text-[10px] text-[var(--color-pixel-text-dim)] mb-2">
            Or try one of these:
          </label>
          <div className="flex flex-wrap gap-1">
            {EXAMPLE_SCENARIOS.map((example, i) => (
              <button
                key={i}
                onClick={() => useExample(example)}
                disabled={isLoading}
                className="px-2 py-1 text-[9px] bg-transparent text-[var(--color-pixel-text-dim)] border border-[#888] hover:border-[var(--color-pixel-accent)] hover:text-[var(--color-pixel-text)] disabled:opacity-50 truncate max-w-[200px]"
              >
                {example.slice(0, 40)}...
              </button>
            ))}
          </div>
        </div>

        {/* Part Selection */}
        <div>
          <label className="block text-[11px] text-[var(--color-pixel-text)] mb-2">
            Which parts will join this battle? (select at least 1)
          </label>
          {parts.length === 0 ? (
            <div className="p-3 bg-[var(--color-pixel-bg)] border border-[var(--color-pixel-warning)] text-[10px] text-[var(--color-pixel-warning)]">
              You need to create at least one Part first! Go to the Parts view to add one.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {parts.map(({ part, personality }) => {
                const isSelected = selectedPartIds.includes(part.id);
                return (
                  <button
                    key={part.id}
                    onClick={() => togglePart(part.id)}
                    disabled={isLoading}
                    className={`
                      flex items-center gap-2 p-2 border-2 transition-colors
                      ${isSelected
                        ? 'bg-[var(--color-pixel-accent)]/20 border-[var(--color-pixel-accent)]'
                        : 'bg-[var(--color-pixel-bg)] border-[#888] hover:border-[var(--color-pixel-secondary)]'
                      }
                      disabled:opacity-50
                    `}
                  >
                    <CharacterPortrait part={part} mood="neutral" size="sm" />
                    <div className="flex-1 min-w-0 text-left">
                      <div className={`text-[10px] truncate ${isSelected ? 'text-[var(--color-pixel-accent)]' : 'text-[var(--color-pixel-text)]'}`}>
                        {part.name}
                      </div>
                      {personality && (
                        <div className="text-[8px] text-[var(--color-pixel-text-dim)] truncate">
                          {personality.traits.slice(0, 2).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className={`w-4 h-4 border-2 flex items-center justify-center ${isSelected ? 'border-[var(--color-pixel-accent)] bg-[var(--color-pixel-accent)]' : 'border-[#888]'}`}>
                      {isSelected && <span className="text-black text-[10px]">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t-2 border-[var(--color-pixel-secondary)] flex justify-between items-center">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-[10px] bg-transparent text-[var(--color-pixel-text)] border-2 border-[#888] hover:border-[var(--color-pixel-accent)] disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading || !scenario.trim() || selectedPartIds.length === 0}
          className="px-4 py-2 text-[10px] bg-[var(--color-pixel-accent)] text-black border-2 border-[var(--color-pixel-accent)] hover:brightness-110 disabled:opacity-50"
        >
          {isLoading ? 'Generating Villain...' : 'Generate Villain'}
        </button>
      </div>
    </div>
  );
}
