import type { Relationship } from '../../models/types';
import { RELATIONSHIP_TITLES, RELATIONSHIP_XP_THRESHOLDS } from '../../models/types';

interface RelationshipProgressProps {
  relationship: Relationship;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function RelationshipProgress({
  relationship,
  showDetails = false,
  size = 'md',
}: RelationshipProgressProps) {
  const { level, experience, title } = relationship;

  // Calculate progress to next level
  const currentThreshold = RELATIONSHIP_XP_THRESHOLDS[level] ?? 0;
  const nextThreshold = RELATIONSHIP_XP_THRESHOLDS[level + 1] ?? RELATIONSHIP_XP_THRESHOLDS[10] ?? 10000;
  const progressToNext = ((experience - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

  // Size configurations
  const sizes = {
    sm: { bar: 'h-1', text: 'text-[8px]', level: 'text-[10px]' },
    md: { bar: 'h-2', text: 'text-[9px]', level: 'text-[12px]' },
    lg: { bar: 'h-3', text: 'text-[10px]', level: 'text-[14px]' },
  };

  const sizeConfig = sizes[size];

  // Level color
  const getLevelColor = () => {
    if (level >= 9) return 'var(--color-pixel-accent)';
    if (level >= 7) return 'var(--color-pixel-success)';
    if (level >= 5) return 'var(--color-pixel-warning)';
    if (level >= 3) return 'var(--color-pixel-primary)';
    return 'var(--color-pixel-text-dim)';
  };

  // Level stars/hearts visual
  const renderLevelIndicator = () => {
    const filled = Math.min(level, 10);
    const empty = 10 - filled;

    return (
      <div className="flex gap-0.5">
        {[...Array(filled)].map((_, i) => (
          <span
            key={`filled-${i}`}
            className={sizeConfig.text}
            style={{ color: getLevelColor() }}
          >
            ★
          </span>
        ))}
        {[...Array(empty)].map((_, i) => (
          <span
            key={`empty-${i}`}
            className={`${sizeConfig.text} text-[var(--color-pixel-text-dim)] opacity-30`}
          >
            ☆
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {/* Header with level and title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`${sizeConfig.level} font-bold`}
            style={{ color: getLevelColor() }}
          >
            Lv.{level}
          </span>
          <span className={`${sizeConfig.text} text-[var(--color-pixel-text)]`}>
            {title}
          </span>
        </div>
        {showDetails && (
          <span className={`${sizeConfig.text} text-[var(--color-pixel-text-dim)]`}>
            {experience} / {nextThreshold} XP
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className={`${sizeConfig.bar} bg-[var(--color-pixel-bg)] border border-[#888] overflow-hidden`}>
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${Math.min(100, Math.max(0, progressToNext))}%`,
            backgroundColor: getLevelColor(),
          }}
        />
      </div>

      {/* Stars/hearts indicator */}
      {showDetails && renderLevelIndicator()}

      {/* Next milestone hint */}
      {showDetails && level < 10 && (
        <div className={`${sizeConfig.text} text-[var(--color-pixel-text-dim)]`}>
          {nextThreshold - experience} XP to "{RELATIONSHIP_TITLES[level]}"
        </div>
      )}
    </div>
  );
}
