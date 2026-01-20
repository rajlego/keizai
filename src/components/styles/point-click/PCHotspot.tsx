import type { Part, PartMood, PartGameState } from '../../../models/types';

interface PCHotspotProps {
  part: Part;
  mood: PartMood;
  gameState?: PartGameState;
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
  isActive?: boolean;
  isHovered?: boolean;
  onHover: (hovered: boolean) => void;
  onClick: () => void;
}

const MOOD_INDICATORS: Record<PartMood, string> = {
  happy: '😊',
  neutral: '😐',
  sad: '😢',
  anxious: '😰',
  excited: '🤩',
  angry: '😠',
};

export function PCHotspot({
  part,
  mood,
  gameState,
  x,
  y,
  width,
  height,
  isActive = false,
  isHovered = false,
  onHover,
  onClick,
}: PCHotspotProps) {
  return (
    <div
      className={`
        absolute cursor-pointer transition-all duration-200
        ${isHovered ? 'z-20' : 'z-10'}
      `}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        height: `${height}%`,
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={onClick}
    >
      {/* Character silhouette/sprite */}
      <div
        className={`
          relative w-full h-full
          border-4 transition-all duration-200
          ${isActive
            ? 'border-[var(--color-pixel-accent)] bg-[var(--color-pixel-surface)]'
            : isHovered
              ? 'border-[var(--color-pixel-secondary)] bg-[var(--color-pixel-surface)]/90'
              : 'border-transparent bg-[var(--color-pixel-surface)]/70'
          }
        `}
      >
        {/* Avatar or silhouette */}
        <div className="absolute inset-2 flex items-center justify-center overflow-hidden">
          {part.avatarUrl ? (
            <img
              src={part.avatarUrl}
              alt={part.name}
              className={`
                w-full h-full object-cover transition-all duration-200
                ${isHovered ? 'brightness-110' : 'brightness-90'}
              `}
              style={{ imageRendering: 'pixelated' }}
            />
          ) : (
            <div
              className={`
                text-center transition-transform duration-200
                ${isHovered ? 'scale-110' : 'scale-100'}
              `}
            >
              <div className="text-4xl font-bold text-[var(--color-pixel-accent)]">
                {part.name.charAt(0)}
              </div>
              <div className="text-xl mt-1">
                {MOOD_INDICATORS[mood]}
              </div>
            </div>
          )}
        </div>

        {/* Highlight outline on hover */}
        {isHovered && (
          <div
            className="absolute inset-0 border-2 border-[var(--color-pixel-accent)] animate-pulse"
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Pending request indicator */}
        {gameState?.pendingRequest && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="bg-[var(--color-pixel-warning)] text-black text-[10px] px-2 py-0.5 border border-black">
              ❗
            </div>
          </div>
        )}

        {/* Mood bubble (shown on hover) */}
        {isHovered && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-lg animate-bounce">
            {mood === 'happy' && '♪'}
            {mood === 'neutral' && '...'}
            {mood === 'sad' && '💧'}
            {mood === 'anxious' && '💦'}
            {mood === 'excited' && '✨'}
            {mood === 'angry' && '💢'}
          </div>
        )}
      </div>

      {/* Name plate */}
      <div
        className={`
          absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5
          text-[10px] whitespace-nowrap transition-all duration-200
          border-2
          ${isActive
            ? 'bg-[var(--color-pixel-accent)] border-[var(--color-pixel-accent)] text-black'
            : isHovered
              ? 'bg-[var(--color-pixel-surface)] border-[var(--color-pixel-accent)] text-[var(--color-pixel-text)]'
              : 'bg-[var(--color-pixel-bg)]/80 border-[var(--color-pixel-secondary)] text-[var(--color-pixel-text-dim)]'
          }
        `}
      >
        {part.name}
      </div>

      {/* Active glow effect */}
      {isActive && (
        <div
          className="absolute inset-0 -m-1 border-2 border-[var(--color-pixel-accent)] opacity-50 animate-pulse pointer-events-none"
        />
      )}

      {/* Click ripple area indicator */}
      {isHovered && (
        <div
          className="absolute inset-0 bg-[var(--color-pixel-accent)]/10 pointer-events-none"
        />
      )}
    </div>
  );
}
