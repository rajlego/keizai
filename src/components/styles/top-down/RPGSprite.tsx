import type { Part, PartMood, PartGameState } from '../../../models/types';

interface RPGSpriteProps {
  part: Part;
  mood: PartMood;
  gameState?: PartGameState;
  gridX: number;
  gridY: number;
  isActive?: boolean;
  onClick: () => void;
}

const MOOD_COLORS: Record<PartMood, string> = {
  happy: 'var(--color-pixel-success)',
  neutral: 'var(--color-pixel-accent)',
  sad: 'var(--color-pixel-primary)',
  anxious: 'var(--color-pixel-warning)',
  excited: '#ff69b4',
  angry: 'var(--color-pixel-error)',
};

export function RPGSprite({
  part,
  mood,
  gameState,
  gridX,
  gridY,
  isActive = false,
  onClick,
}: RPGSpriteProps) {
  return (
    <div
      className={`
        absolute cursor-pointer transition-all duration-150
        ${isActive ? 'z-30' : 'z-10'}
      `}
      style={{
        left: `${gridX * 10 + 5}%`,
        top: `${gridY * 14.28 + 7}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={onClick}
    >
      {/* Chibi sprite container */}
      <div
        className={`
          relative w-10 h-12
          transition-transform duration-150
          ${isActive ? 'scale-110' : 'hover:scale-105'}
        `}
      >
        {/* Body */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 border-2 border-black"
          style={{ backgroundColor: MOOD_COLORS[mood] }}
        >
          {/* Face area */}
          <div className="absolute inset-1 bg-[#ffe4c4] border border-black flex items-center justify-center">
            {part.avatarUrl ? (
              <img
                src={part.avatarUrl}
                alt={part.name}
                className="w-full h-full object-cover"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              <span className="text-[8px] font-bold text-black">
                {part.name.charAt(0)}
              </span>
            )}
          </div>
        </div>

        {/* Mood indicator (floating) */}
        {mood !== 'neutral' && (
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] animate-bounce"
            style={{ animationDuration: '1s' }}
          >
            {mood === 'happy' && '♪'}
            {mood === 'sad' && '💧'}
            {mood === 'anxious' && '!'}
            {mood === 'excited' && '★'}
            {mood === 'angry' && '💢'}
          </div>
        )}

        {/* Shadow */}
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-black/30 rounded-full"
        />

        {/* Name tag */}
        <div
          className={`
            absolute -bottom-5 left-1/2 -translate-x-1/2
            px-1 py-0.5 text-[7px] whitespace-nowrap
            border border-black
            ${isActive
              ? 'bg-[var(--color-pixel-accent)] text-black'
              : 'bg-black/70 text-white'
            }
          `}
        >
          {part.name.slice(0, 6)}
        </div>

        {/* Active indicator */}
        {isActive && (
          <div
            className="absolute -inset-2 border-2 border-[var(--color-pixel-accent)] animate-pulse"
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Pending request indicator */}
        {gameState?.pendingRequest && (
          <div
            className="absolute -top-4 left-1/2 -translate-x-1/2 text-[12px] animate-bounce"
          >
            ❗
          </div>
        )}
      </div>
    </div>
  );
}
