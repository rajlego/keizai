import { useState } from 'react';
import type { BattleCharacter, HeroArchetype } from '../../../models/types';
import { HERO_ARCHETYPES } from '../../../models/types';
import { NOTABLE_HEROES } from '../../../services/battle/heroGenerator';

interface HeroSelectionProps {
  villain: BattleCharacter;
  selectedHeroes: BattleCharacter[];
  onSelectArchetype: (archetype: HeroArchetype) => void;
  onSummonCustom: (request: string) => void;
  onRemoveHero: (heroId: string) => void;
  onStartBattle: () => void;
  onBack: () => void;
  isLoading?: boolean;
  maxHeroes?: number;
}

// Archetypes to show in the grid (excluding 'custom')
const ARCHETYPE_OPTIONS: HeroArchetype[] = [
  'saber', 'archer', 'lancer', 'caster', 'rider',
  'assassin', 'berserker', 'shielder', 'ruler',
];

export function HeroSelection({
  villain,
  selectedHeroes,
  onSelectArchetype,
  onSummonCustom,
  onRemoveHero,
  onStartBattle,
  onBack,
  isLoading = false,
  maxHeroes = 3,
}: HeroSelectionProps) {
  const [customRequest, setCustomRequest] = useState('');
  const [showNotable, setShowNotable] = useState(false);

  const canAddMore = selectedHeroes.length < maxHeroes;

  const handleSummonCustom = () => {
    if (customRequest.trim()) {
      onSummonCustom(customRequest.trim());
      setCustomRequest('');
    }
  };

  const handleNotableSelect = (heroName: string) => {
    onSummonCustom(heroName);
    setShowNotable(false);
  };

  return (
    <div className="bg-[var(--color-pixel-surface)] border-4 border-[var(--color-pixel-secondary)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="p-4 border-b-2 border-[var(--color-pixel-secondary)] bg-[var(--color-pixel-bg)]">
        <h2 className="text-[16px] text-[var(--color-pixel-accent)] font-bold">
          Summon Your Heroes
        </h2>
        <p className="text-[10px] text-[var(--color-pixel-text-dim)] mt-1">
          Choose up to {maxHeroes} heroes to help face <span className="text-[var(--color-pixel-error)]">{villain.name}</span>
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Selected Heroes */}
        {selectedHeroes.length > 0 && (
          <div>
            <label className="block text-[11px] text-[var(--color-pixel-text)] mb-2">
              Your Team ({selectedHeroes.length}/{maxHeroes})
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedHeroes.map(hero => (
                <div
                  key={hero.id}
                  className="flex items-center gap-2 px-3 py-2 bg-[var(--color-pixel-bg)] border-2 border-[var(--color-pixel-accent)]"
                >
                  <div className="w-8 h-8 border-2 border-[var(--color-pixel-accent)] bg-[var(--color-pixel-surface)] flex items-center justify-center overflow-hidden">
                    {hero.avatarUrl ? (
                      <img src={hero.avatarUrl} alt={hero.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[14px]">⚔️</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-[var(--color-pixel-accent)] font-bold">
                      {hero.name}
                    </div>
                    <div className="text-[8px] text-[var(--color-pixel-text-dim)]">
                      {hero.archetype ? HERO_ARCHETYPES[hero.archetype].name : 'Custom'}
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveHero(hero.id)}
                    disabled={isLoading}
                    className="text-[var(--color-pixel-error)] hover:brightness-150 disabled:opacity-50"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Archetype Selection */}
        {canAddMore && (
          <div>
            <label className="block text-[11px] text-[var(--color-pixel-text)] mb-2">
              Choose an Archetype
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ARCHETYPE_OPTIONS.map(archetype => {
                const def = HERO_ARCHETYPES[archetype];
                const alreadySelected = selectedHeroes.some(h => h.archetype === archetype);
                return (
                  <button
                    key={archetype}
                    onClick={() => onSelectArchetype(archetype)}
                    disabled={isLoading || alreadySelected}
                    className={`
                      p-2 border-2 text-left transition-colors
                      ${alreadySelected
                        ? 'border-[#888] bg-[var(--color-pixel-bg)] opacity-50'
                        : 'border-[#888] bg-[var(--color-pixel-bg)] hover:border-[var(--color-pixel-accent)]'
                      }
                      disabled:cursor-not-allowed
                    `}
                  >
                    <div className="text-[10px] text-[var(--color-pixel-accent)] font-bold">
                      {def.name}
                    </div>
                    <div className="text-[8px] text-[var(--color-pixel-text-dim)] line-clamp-2">
                      {def.description}
                    </div>
                    <div className="text-[7px] text-[var(--color-pixel-primary)] mt-1">
                      {def.specialAbility.split(' - ')[0]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom Hero Summon */}
        {canAddMore && (
          <div>
            <label className="block text-[11px] text-[var(--color-pixel-text)] mb-2">
              Or Summon a Custom Hero
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customRequest}
                onChange={(e) => setCustomRequest(e.target.value)}
                placeholder="e.g., 'Marcus Aurelius', 'a wise grandmother figure'"
                className="flex-1 px-3 py-2 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[10px] focus:border-[var(--color-pixel-accent)] outline-none"
                disabled={isLoading}
                onKeyDown={(e) => e.key === 'Enter' && handleSummonCustom()}
              />
              <button
                onClick={handleSummonCustom}
                disabled={isLoading || !customRequest.trim()}
                className="px-4 py-2 text-[10px] bg-[var(--color-pixel-primary)] text-white border-2 border-[var(--color-pixel-primary)] hover:brightness-110 disabled:opacity-50"
              >
                {isLoading ? 'Summoning...' : 'Summon'}
              </button>
            </div>

            {/* Notable Heroes Quick Select */}
            <div className="mt-2">
              <button
                onClick={() => setShowNotable(!showNotable)}
                className="text-[9px] text-[var(--color-pixel-text-dim)] hover:text-[var(--color-pixel-text)]"
              >
                {showNotable ? '▲ Hide Notable Figures' : '▼ Show Notable Figures'}
              </button>
              {showNotable && (
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-1">
                  {Object.entries(NOTABLE_HEROES).map(([key, hero]) => (
                    <button
                      key={key}
                      onClick={() => handleNotableSelect(hero.name)}
                      disabled={isLoading}
                      className="px-2 py-1 text-[8px] bg-transparent text-[var(--color-pixel-text-dim)] border border-[#888] hover:border-[var(--color-pixel-accent)] hover:text-[var(--color-pixel-text)] disabled:opacity-50 text-left"
                    >
                      <span className="text-[var(--color-pixel-accent)]">{hero.name}</span>
                      <span className="block text-[7px] opacity-70">{hero.archetype}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Battle Info */}
        <div className="p-3 bg-[var(--color-pixel-bg)] border border-[var(--color-pixel-secondary)]">
          <div className="text-[10px] text-[var(--color-pixel-text-dim)] mb-2">Battle Preview</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedHeroes.length === 0 ? (
                <span className="text-[9px] text-[var(--color-pixel-text-dim)]">No heroes selected</span>
              ) : (
                selectedHeroes.map(h => (
                  <div key={h.id} className="w-6 h-6 border border-[var(--color-pixel-accent)] bg-[var(--color-pixel-surface)] flex items-center justify-center text-[10px]">
                    {h.avatarUrl ? (
                      <img src={h.avatarUrl} alt={h.name} className="w-full h-full object-cover" />
                    ) : '⚔️'}
                  </div>
                ))
              )}
            </div>
            <span className="text-[12px] text-[var(--color-pixel-text-dim)]">VS</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--color-pixel-error)]">{villain.name}</span>
              <div className="w-6 h-6 border border-[var(--color-pixel-error)] bg-[var(--color-pixel-surface)] flex items-center justify-center text-[10px]">
                {villain.avatarUrl ? (
                  <img src={villain.avatarUrl} alt={villain.name} className="w-full h-full object-cover" />
                ) : '👹'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t-2 border-[var(--color-pixel-secondary)] flex justify-between items-center">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="px-3 py-2 text-[10px] bg-transparent text-[var(--color-pixel-text)] border-2 border-[#888] hover:border-[var(--color-pixel-accent)] disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          onClick={onStartBattle}
          disabled={isLoading || selectedHeroes.length === 0}
          className="px-4 py-2 text-[10px] bg-[var(--color-pixel-error)] text-white border-2 border-[var(--color-pixel-error)] hover:brightness-110 disabled:opacity-50"
        >
          {isLoading ? 'Preparing...' : 'Begin Battle!'}
        </button>
      </div>
    </div>
  );
}
