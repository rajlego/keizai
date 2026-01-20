import type { Part, PartMood } from '../../../models/types';

interface VNCharacterSpriteProps {
  part: Part;
  mood: PartMood;
  position: 'left' | 'center' | 'right';
  isActive?: boolean;
  isSpeaking?: boolean;
  onClick: () => void;
}

const POSITION_STYLES = {
  left: {
    transform: 'translateX(-80%) scale(0.85)',
    opacity: 0.7,
    zIndex: 1,
  },
  center: {
    transform: 'translateX(0) scale(1)',
    opacity: 1,
    zIndex: 10,
  },
  right: {
    transform: 'translateX(80%) scale(0.85)',
    opacity: 0.7,
    zIndex: 1,
  },
};

const MOOD_BORDERS: Record<PartMood, string> = {
  happy: 'var(--color-pixel-success)',
  neutral: 'var(--color-pixel-secondary)',
  sad: 'var(--color-pixel-primary)',
  anxious: 'var(--color-pixel-warning)',
  excited: 'var(--color-pixel-accent)',
  angry: 'var(--color-pixel-error)',
};

const MOOD_EXPRESSIONS: Record<PartMood, string> = {
  happy: '^_^',
  neutral: '-_-',
  sad: 'T_T',
  anxious: 'o_o',
  excited: '*o*',
  angry: '>_<',
};

export function VNCharacterSprite({
  part,
  mood,
  position,
  isActive = false,
  isSpeaking = false,
  onClick,
}: VNCharacterSpriteProps) {
  const positionStyle = POSITION_STYLES[position];

  return (
    <div
      className={`
        relative cursor-pointer transition-all duration-300 ease-out
        ${isActive ? 'drop-shadow-lg' : ''}
        ${isSpeaking ? 'animate-pulse' : ''}
      `}
      style={{
        ...positionStyle,
        filter: isActive ? 'brightness(1.1)' : 'brightness(0.9)',
      }}
      onClick={onClick}
    >
      {/* Character sprite container */}
      <div
        className={`
          relative w-40 h-64
          border-4 transition-colors duration-200
          ${isActive ? 'border-[var(--color-pixel-accent)]' : 'border-[var(--color-pixel-secondary)]'}
        `}
        style={{
          borderColor: isActive ? MOOD_BORDERS[mood] : undefined,
          background: 'linear-gradient(180deg, var(--color-pixel-surface) 0%, var(--color-pixel-bg) 100%)',
        }}
      >
        {/* Avatar or initial */}
        <div className="absolute inset-2 flex items-center justify-center overflow-hidden">
          {part.avatarUrl ? (
            <img
              src={part.avatarUrl}
              alt={part.name}
              className="w-full h-full object-cover"
              style={{ imageRendering: 'pixelated' }}
            />
          ) : (
            <div className="text-center">
              <div className="text-6xl font-bold text-[var(--color-pixel-accent)]">
                {part.name.charAt(0)}
              </div>
              <div className="text-2xl mt-2 text-[var(--color-pixel-text-dim)]">
                {MOOD_EXPRESSIONS[mood]}
              </div>
            </div>
          )}
        </div>

        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-1">
            <div className="w-2 h-2 bg-[var(--color-pixel-accent)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-[var(--color-pixel-accent)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-[var(--color-pixel-accent)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}

        {/* Mood indicator (bottom) */}
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[8px] bg-[var(--color-pixel-bg)] border border-[var(--color-pixel-secondary)]"
          style={{ borderColor: MOOD_BORDERS[mood] }}
        >
          {mood}
        </div>
      </div>

      {/* Name plate */}
      <div
        className={`
          mt-2 px-4 py-1 text-center
          border-2 transition-colors duration-200
          ${isActive
            ? 'bg-[var(--color-pixel-accent)] border-[var(--color-pixel-accent)] text-black'
            : 'bg-[var(--color-pixel-surface)] border-[var(--color-pixel-secondary)] text-[var(--color-pixel-text)]'
          }
        `}
      >
        <div className="text-[12px] font-bold truncate">{part.name}</div>
        {isActive && (
          <div className="text-[8px] opacity-80">
            ${part.balance.toLocaleString()}
          </div>
        )}
      </div>

      {/* Selection glow effect */}
      {isActive && (
        <div
          className="absolute inset-0 -m-2 border-2 border-[var(--color-pixel-accent)] opacity-50 animate-pulse pointer-events-none"
          style={{ borderRadius: '4px' }}
        />
      )}
    </div>
  );
}
