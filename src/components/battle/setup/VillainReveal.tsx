import { useState, useEffect } from 'react';
import type { BattleCharacter } from '../../../models/types';

interface VillainRevealProps {
  villain: BattleCharacter;
  scenarioAnalysis?: string;
  onContinue: () => void;
  onRegenerate: () => void;
  onCancel: () => void;
  isGeneratingAvatar?: boolean;
}

export function VillainReveal({
  villain,
  scenarioAnalysis,
  onContinue,
  onRegenerate,
  onCancel,
  isGeneratingAvatar = false,
}: VillainRevealProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  // Reveal animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-[var(--color-pixel-surface)] border-4 border-[var(--color-pixel-secondary)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="p-4 border-b-2 border-[var(--color-pixel-secondary)] bg-[var(--color-pixel-bg)]">
        <h2 className="text-[16px] text-[var(--color-pixel-error)] font-bold">
          A Villain Appears!
        </h2>
        {scenarioAnalysis && (
          <p className="text-[10px] text-[var(--color-pixel-text-dim)] mt-1">
            {scenarioAnalysis}
          </p>
        )}
      </div>

      <div className="p-6">
        {/* Villain Card */}
        <div className={`
          relative p-6 bg-gradient-to-b from-[var(--color-pixel-bg)] to-[var(--color-pixel-surface)]
          border-4 border-[var(--color-pixel-error)] transition-all duration-500
          ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <div className="w-32 h-32 border-4 border-[var(--color-pixel-error)] bg-[var(--color-pixel-bg)] flex items-center justify-center overflow-hidden">
              {isGeneratingAvatar ? (
                <div className="text-[10px] text-[var(--color-pixel-text-dim)] text-center animate-pulse">
                  Generating<br />avatar...
                </div>
              ) : villain.avatarUrl ? (
                <img
                  src={villain.avatarUrl}
                  alt={villain.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-[48px]">👹</div>
              )}
            </div>
          </div>

          {/* Name */}
          <h3 className="text-center text-[20px] text-[var(--color-pixel-error)] font-bold mb-2">
            {villain.name}
          </h3>

          {/* Description */}
          <p className="text-center text-[11px] text-[var(--color-pixel-text)] mb-4">
            {villain.description}
          </p>

          {/* Stats Bars */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <div className="text-[8px] text-[var(--color-pixel-text-dim)] mb-1">Health</div>
              <div className="h-2 bg-[var(--color-pixel-bg)] border border-[#888]">
                <div
                  className="h-full bg-[var(--color-pixel-error)] transition-all duration-1000"
                  style={{ width: animationComplete ? '100%' : '0%' }}
                />
              </div>
              <div className="text-[9px] text-[var(--color-pixel-error)] mt-1">
                {villain.health}/{villain.maxHealth}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[8px] text-[var(--color-pixel-text-dim)] mb-1">Understanding</div>
              <div className="h-2 bg-[var(--color-pixel-bg)] border border-[#888]">
                <div
                  className="h-full bg-[var(--color-pixel-primary)]"
                  style={{ width: `${villain.understanding}%` }}
                />
              </div>
              <div className="text-[9px] text-[var(--color-pixel-primary)] mt-1">
                {villain.understanding}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-[8px] text-[var(--color-pixel-text-dim)] mb-1">Trust</div>
              <div className="h-2 bg-[var(--color-pixel-bg)] border border-[#888]">
                <div
                  className="h-full bg-[var(--color-pixel-success)]"
                  style={{ width: `${villain.trust}%` }}
                />
              </div>
              <div className="text-[9px] text-[var(--color-pixel-success)] mt-1">
                {villain.trust}%
              </div>
            </div>
          </div>

          {/* Traits */}
          <div className="flex flex-wrap gap-1 justify-center mb-4">
            {villain.traits.map((trait, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-[8px] bg-[var(--color-pixel-error)]/20 text-[var(--color-pixel-error)] border border-[var(--color-pixel-error)]"
              >
                {trait}
              </span>
            ))}
          </div>

          {/* Toggle Details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-[9px] text-[var(--color-pixel-text-dim)] hover:text-[var(--color-pixel-text)]"
          >
            {showDetails ? '▲ Hide Details' : '▼ Show Details'}
          </button>

          {/* Details */}
          {showDetails && (
            <div className="mt-3 p-3 bg-[var(--color-pixel-bg)] border border-[var(--color-pixel-secondary)] space-y-2">
              <div>
                <span className="text-[9px] text-[var(--color-pixel-text-dim)]">Speech Style: </span>
                <span className="text-[9px] text-[var(--color-pixel-text)]">{villain.speechStyle}</span>
              </div>
              <div>
                <span className="text-[9px] text-[var(--color-pixel-text-dim)]">Core Need (hidden): </span>
                <span className="text-[9px] text-[var(--color-pixel-warning)]">{villain.coreNeed}</span>
              </div>
            </div>
          )}
        </div>

        {/* Victory Conditions Info */}
        <div className="mt-4 p-3 bg-[var(--color-pixel-bg)] border border-[var(--color-pixel-secondary)]">
          <div className="text-[10px] text-[var(--color-pixel-text-dim)] mb-2">Victory Conditions:</div>
          <div className="grid grid-cols-3 gap-2 text-[9px]">
            <div className="text-center">
              <div className="text-[var(--color-pixel-error)]">HP → 0</div>
              <div className="text-[var(--color-pixel-text-dim)]">Direct defeat</div>
            </div>
            <div className="text-center">
              <div className="text-[var(--color-pixel-primary)]">Understanding → 100%</div>
              <div className="text-[var(--color-pixel-text-dim)]">Integration</div>
            </div>
            <div className="text-center">
              <div className="text-[var(--color-pixel-success)]">Trust → 100%</div>
              <div className="text-[var(--color-pixel-text-dim)]">Negotiation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t-2 border-[var(--color-pixel-secondary)] flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-2 text-[10px] bg-transparent text-[var(--color-pixel-text)] border-2 border-[#888] hover:border-[var(--color-pixel-accent)]"
          >
            Cancel
          </button>
          <button
            onClick={onRegenerate}
            className="px-3 py-2 text-[10px] bg-transparent text-[var(--color-pixel-text-dim)] border-2 border-[#888] hover:border-[var(--color-pixel-warning)] hover:text-[var(--color-pixel-warning)]"
          >
            Regenerate
          </button>
        </div>
        <button
          onClick={onContinue}
          className="px-4 py-2 text-[10px] bg-[var(--color-pixel-accent)] text-black border-2 border-[var(--color-pixel-accent)] hover:brightness-110"
        >
          Summon Heroes →
        </button>
      </div>
    </div>
  );
}
