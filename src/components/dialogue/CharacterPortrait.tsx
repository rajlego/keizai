import type { Part, PartMood } from '../../models/types';

interface CharacterPortraitProps {
  part: Part;
  mood?: PartMood;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  showMood?: boolean;
  className?: string;
}

// Mood to expression emoji mapping (fallback when no avatar)
const MOOD_EXPRESSIONS: Record<PartMood, string> = {
  happy: '😊',
  neutral: '😐',
  sad: '😢',
  anxious: '😰',
  excited: '🤩',
  angry: '😠',
};

// Mood to border color mapping
const MOOD_COLORS: Record<PartMood, string> = {
  happy: 'border-[var(--color-pixel-success)]',
  neutral: 'border-[var(--color-pixel-accent)]',
  sad: 'border-blue-400',
  anxious: 'border-[var(--color-pixel-warning)]',
  excited: 'border-pink-400',
  angry: 'border-[var(--color-pixel-error)]',
};

// Size configurations
const SIZE_CLASSES = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48',
};

const NAME_SIZE_CLASSES = {
  sm: 'text-[8px]',
  md: 'text-[10px]',
  lg: 'text-[12px]',
  xl: 'text-[14px]',
};

export function CharacterPortrait({
  part,
  mood = 'neutral',
  size = 'md',
  showName = true,
  showMood = false,
  className = '',
}: CharacterPortraitProps) {
  const sizeClass = SIZE_CLASSES[size];
  const moodColor = MOOD_COLORS[mood];
  const nameSize = NAME_SIZE_CLASSES[size];
  const expression = MOOD_EXPRESSIONS[mood];

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Portrait Container */}
      <div
        className={`${sizeClass} relative border-4 ${moodColor} bg-[var(--color-pixel-bg)] overflow-hidden transition-colors duration-300`}
        style={{ imageRendering: 'pixelated' }}
      >
        {part.avatarUrl ? (
          <img
            src={part.avatarUrl}
            alt={part.name}
            className="w-full h-full object-cover"
            style={{ imageRendering: 'auto' }}
          />
        ) : (
          // Fallback: Show initial letter with mood expression
          <div className="w-full h-full flex flex-col items-center justify-center">
            <span
              className="text-[var(--color-pixel-text)]"
              style={{ fontSize: size === 'xl' ? '48px' : size === 'lg' ? '32px' : size === 'md' ? '24px' : '16px' }}
            >
              {part.name.charAt(0).toUpperCase()}
            </span>
            {showMood && (
              <span className="text-lg">{expression}</span>
            )}
          </div>
        )}

        {/* Mood indicator overlay (when has avatar) */}
        {part.avatarUrl && showMood && (
          <div className="absolute bottom-0 right-0 bg-[var(--color-pixel-bg)] px-1 border-t-2 border-l-2 border-[var(--color-pixel-secondary)]">
            <span className="text-sm">{expression}</span>
          </div>
        )}
      </div>

      {/* Name */}
      {showName && (
        <span
          className={`mt-1 text-[var(--color-pixel-text)] ${nameSize} text-center truncate max-w-full`}
          style={{ maxWidth: size === 'xl' ? '192px' : size === 'lg' ? '128px' : size === 'md' ? '80px' : '48px' }}
        >
          {part.name}
        </span>
      )}
    </div>
  );
}
