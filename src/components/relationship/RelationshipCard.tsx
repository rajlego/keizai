import type { Part, Relationship } from '../../models/types';
import { RELATIONSHIP_TITLES, RELATIONSHIP_XP_THRESHOLDS } from '../../models/types';
import { CharacterPortrait } from '../dialogue/CharacterPortrait';

interface RelationshipCardProps {
  part: Part;
  relationship: Relationship;
  onClick?: () => void;
  compact?: boolean;
}

export function RelationshipCard({
  part,
  relationship,
  onClick,
  compact = false,
}: RelationshipCardProps) {
  const { level, experience, title, unlockedAbilities } = relationship;

  // Calculate progress to next level
  const currentThreshold = RELATIONSHIP_XP_THRESHOLDS[level] ?? 0;
  const nextThreshold = RELATIONSHIP_XP_THRESHOLDS[level + 1] ?? RELATIONSHIP_XP_THRESHOLDS[10] ?? 10000;
  const progressToNext = ((experience - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

  // Level color based on level
  const getLevelColor = () => {
    if (level >= 9) return 'var(--color-pixel-accent)';
    if (level >= 7) return 'var(--color-pixel-success)';
    if (level >= 5) return 'var(--color-pixel-warning)';
    if (level >= 3) return 'var(--color-pixel-primary)';
    return 'var(--color-pixel-text-dim)';
  };

  if (compact) {
    return (
      <div
        className={`
          flex items-center gap-2 p-2 bg-[var(--color-pixel-surface)] border-2 border-[var(--color-pixel-secondary)]
          ${onClick ? 'cursor-pointer hover:border-[var(--color-pixel-accent)]' : ''}
        `}
        onClick={onClick}
      >
        <CharacterPortrait part={part} mood="neutral" size="sm" />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-[var(--color-pixel-text)] truncate">
            {part.name}
          </div>
          <div className="flex items-center gap-1">
            <span
              className="text-[9px] font-bold"
              style={{ color: getLevelColor() }}
            >
              Lv.{level}
            </span>
            <span className="text-[8px] text-[var(--color-pixel-text-dim)]">
              {title}
            </span>
          </div>
        </div>
        {/* Mini progress bar */}
        <div className="w-12 h-1 bg-[var(--color-pixel-bg)] border border-[#888]">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${Math.min(100, progressToNext)}%`,
              backgroundColor: getLevelColor(),
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-[var(--color-pixel-surface)] border-4 border-[var(--color-pixel-secondary)] p-3
        ${onClick ? 'cursor-pointer hover:border-[var(--color-pixel-accent)]' : ''}
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <CharacterPortrait part={part} mood="neutral" size="md" />
        <div className="flex-1">
          <div className="text-[12px] text-[var(--color-pixel-accent)] font-bold">
            {part.name}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-[14px] font-bold"
              style={{ color: getLevelColor() }}
            >
              Level {level}
            </span>
            <span className="text-[10px] text-[var(--color-pixel-text)]">
              {title}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[8px] text-[var(--color-pixel-text-dim)] mb-1">
          <span>EXP: {experience}</span>
          <span>Next: {nextThreshold}</span>
        </div>
        <div className="h-3 bg-[var(--color-pixel-bg)] border-2 border-[#888]">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${Math.min(100, progressToNext)}%`,
              backgroundColor: getLevelColor(),
            }}
          />
        </div>
      </div>

      {/* Level milestones */}
      <div className="flex justify-between mb-3">
        {[1, 3, 5, 7, 10].map((milestone) => (
          <div
            key={milestone}
            className={`
              w-6 h-6 flex items-center justify-center text-[8px] border-2
              ${level >= milestone
                ? 'bg-[var(--color-pixel-accent)] border-[var(--color-pixel-accent)] text-black'
                : 'bg-[var(--color-pixel-bg)] border-[#888] text-[var(--color-pixel-text-dim)]'
              }
            `}
          >
            {milestone}
          </div>
        ))}
      </div>

      {/* Unlocked abilities */}
      {unlockedAbilities.length > 0 && (
        <div className="border-t border-[var(--color-pixel-secondary)] pt-2">
          <div className="text-[8px] text-[var(--color-pixel-text-dim)] mb-1">
            Unlocked Abilities:
          </div>
          <div className="flex flex-wrap gap-1">
            {unlockedAbilities.map((ability, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-[8px] bg-[var(--color-pixel-primary)]/20 text-[var(--color-pixel-primary)] border border-[var(--color-pixel-primary)]"
              >
                {ability}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Title progression preview */}
      <div className="mt-2 text-[8px] text-[var(--color-pixel-text-dim)]">
        {level < 10 && (
          <span>
            Next title: <span className="text-[var(--color-pixel-accent)]">{RELATIONSHIP_TITLES[level]}</span>
          </span>
        )}
        {level >= 10 && (
          <span className="text-[var(--color-pixel-success)]">
            Max level reached!
          </span>
        )}
      </div>
    </div>
  );
}
