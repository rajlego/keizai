import { useState } from 'react';
import type { Part, PartGameState, PartMood } from '../../../models/types';
import { CharacterPortrait } from '../../dialogue';

interface HubCharacterProps {
  part: Part;
  gameState: PartGameState;
  onClick: () => void;
  isActive?: boolean;
}

// Mood to speech bubble text
const MOOD_BUBBLES: Record<PartMood, string[]> = {
  happy: ['♪', '!', '★'],
  neutral: ['...', '?', '~'],
  sad: ['...', '💧', ';;'],
  anxious: ['!?', '...!', '💦'],
  excited: ['!!', '★★', '♪♪'],
  angry: ['!!', '💢', '...!'],
};

export function HubCharacter({
  part,
  gameState,
  onClick,
  isActive = false,
}: HubCharacterProps) {
  const [isHovered, setIsHovered] = useState(false);

  const { position, mood, pendingRequest } = gameState;

  // Get random mood bubble
  const moodBubble = MOOD_BUBBLES[mood][Math.floor(Math.random() * 3)];

  return (
    <div
      className={`
        absolute cursor-pointer transition-all duration-200
        ${isHovered ? 'scale-110 z-10' : 'scale-100'}
        ${isActive ? 'z-20' : ''}
      `}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -50%) ${isHovered ? 'scale(1.1)' : 'scale(1)'}`,
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Pending request indicator */}
      {pendingRequest && (
        <div
          className={`
            absolute -top-6 left-1/2 -translate-x-1/2
            px-2 py-1 text-[8px] whitespace-nowrap
            bg-[var(--color-pixel-warning)] text-[var(--color-pixel-bg)]
            border-2 border-[#000] animate-bounce
          `}
        >
          {pendingRequest.type === 'loan' && '💰 Wants to talk'}
          {pendingRequest.type === 'complaint' && '😤 Has concerns'}
          {pendingRequest.type === 'celebration' && '🎉 Good news!'}
          {pendingRequest.type === 'debate' && '💭 Wants to discuss'}
          {pendingRequest.type === 'question' && '❓ Has a question'}
        </div>
      )}

      {/* Character */}
      <div
        className={`
          relative
          ${isActive ? 'ring-4 ring-[var(--color-pixel-accent)]' : ''}
        `}
      >
        <CharacterPortrait
          part={part}
          mood={mood}
          size="md"
          showName={true}
          showMood={isHovered}
        />

        {/* Hover speech bubble */}
        {isHovered && !pendingRequest && (
          <div
            className="absolute -top-4 left-1/2 -translate-x-1/2 text-[12px] animate-pulse"
          >
            {moodBubble}
          </div>
        )}

        {/* Balance indicator on hover */}
        {isHovered && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="text-[8px] text-[var(--color-pixel-accent)]">
              ${part.balance.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Shadow */}
      <div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-2 bg-black/30 rounded-full"
        style={{
          filter: 'blur(2px)',
        }}
      />

      {/* Active indicator ring */}
      {isActive && (
        <div
          className="absolute inset-0 -m-2 border-4 border-[var(--color-pixel-accent)] animate-pulse rounded-lg"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </div>
  );
}
