import type { BattleCharacter } from '../../../models/types';
import { HERO_ARCHETYPES } from '../../../models/types';

interface CharacterDisplayProps {
  character: BattleCharacter;
  isActive?: boolean;
  isTargeted?: boolean;
  side: 'left' | 'right';
  onClick?: () => void;
  compact?: boolean;
}

export function CharacterDisplay({
  character,
  isActive = false,
  isTargeted = false,
  side,
  onClick,
  compact = false,
}: CharacterDisplayProps) {
  const isVillain = character.role === 'villain';
  const healthPercent = (character.health / character.maxHealth) * 100;

  // Color based on health
  const getHealthColor = () => {
    if (healthPercent > 60) return 'var(--color-pixel-success)';
    if (healthPercent > 30) return 'var(--color-pixel-warning)';
    return 'var(--color-pixel-error)';
  };

  const borderColor = isActive
    ? 'var(--color-pixel-accent)'
    : isTargeted
      ? 'var(--color-pixel-warning)'
      : isVillain
        ? 'var(--color-pixel-error)'
        : 'var(--color-pixel-primary)';

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`
          flex items-center gap-2 p-2 border-2 transition-all
          ${onClick ? 'cursor-pointer hover:brightness-110' : ''}
          ${isActive ? 'animate-pulse' : ''}
        `}
        style={{ borderColor }}
      >
        {/* Avatar */}
        <div
          className="w-10 h-10 border-2 flex items-center justify-center overflow-hidden"
          style={{ borderColor }}
        >
          {character.avatarUrl ? (
            <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[16px]">{isVillain ? '👹' : '⚔️'}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold truncate" style={{ color: borderColor }}>
            {character.name}
          </div>
          {/* Health bar */}
          <div className="h-1.5 bg-[var(--color-pixel-bg)] border border-[#888] mt-1">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${healthPercent}%`,
                backgroundColor: getHealthColor(),
              }}
            />
          </div>
        </div>

        {/* HP number */}
        <div className="text-[9px] text-[var(--color-pixel-text-dim)]">
          {character.health}/{character.maxHealth}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`
        relative p-3 border-4 transition-all
        ${onClick ? 'cursor-pointer hover:brightness-110' : ''}
        ${isActive ? 'animate-pulse ring-2 ring-[var(--color-pixel-accent)]' : ''}
        ${side === 'left' ? '' : ''}
      `}
      style={{ borderColor, backgroundColor: 'var(--color-pixel-surface)' }}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[8px] bg-[var(--color-pixel-accent)] text-black">
          YOUR TURN
        </div>
      )}

      {/* Avatar */}
      <div className="flex justify-center mb-2">
        <div
          className="w-20 h-20 border-4 flex items-center justify-center overflow-hidden"
          style={{ borderColor }}
        >
          {character.avatarUrl ? (
            <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[32px]">{isVillain ? '👹' : '⚔️'}</span>
          )}
        </div>
      </div>

      {/* Name */}
      <h4
        className="text-center text-[12px] font-bold mb-1"
        style={{ color: borderColor }}
      >
        {character.name}
      </h4>

      {/* Archetype */}
      {character.archetype && character.archetype !== 'custom' && (
        <div className="text-center text-[8px] text-[var(--color-pixel-text-dim)] mb-2">
          {HERO_ARCHETYPES[character.archetype].name}
        </div>
      )}

      {/* Health bar */}
      <div className="mb-2">
        <div className="flex justify-between text-[8px] text-[var(--color-pixel-text-dim)] mb-0.5">
          <span>HP</span>
          <span>{character.health}/{character.maxHealth}</span>
        </div>
        <div className="h-2 bg-[var(--color-pixel-bg)] border border-[#888]">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${healthPercent}%`,
              backgroundColor: getHealthColor(),
            }}
          />
        </div>
      </div>

      {/* Villain-specific: Understanding & Trust */}
      {isVillain && (
        <div className="space-y-1">
          <div>
            <div className="flex justify-between text-[7px] text-[var(--color-pixel-text-dim)]">
              <span>Understanding</span>
              <span>{character.understanding}%</span>
            </div>
            <div className="h-1.5 bg-[var(--color-pixel-bg)] border border-[#888]">
              <div
                className="h-full transition-all duration-500 bg-[var(--color-pixel-primary)]"
                style={{ width: `${character.understanding}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[7px] text-[var(--color-pixel-text-dim)]">
              <span>Trust</span>
              <span>{character.trust}%</span>
            </div>
            <div className="h-1.5 bg-[var(--color-pixel-bg)] border border-[#888]">
              <div
                className="h-full transition-all duration-500 bg-[var(--color-pixel-success)]"
                style={{ width: `${character.trust}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Targeted indicator */}
      {isTargeted && (
        <div className="absolute inset-0 border-4 border-[var(--color-pixel-warning)] animate-pulse pointer-events-none" />
      )}
    </div>
  );
}
