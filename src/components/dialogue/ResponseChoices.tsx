import { useState } from 'react';

interface ResponseChoicesProps {
  choices: string[];
  onSelect: (choice: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ResponseChoices({
  choices,
  onSelect,
  disabled = false,
  className = '',
}: ResponseChoicesProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (choices.length === 0) return null;

  return (
    <div className={`flex flex-col gap-1 pt-2 ${className}`}>
      {choices.map((choice, index) => (
        <button
          key={index}
          onClick={() => !disabled && onSelect(choice)}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          disabled={disabled}
          className={`
            text-left px-3 py-2 text-[10px] transition-all
            border-2 border-transparent
            ${hoveredIndex === index
              ? 'bg-[var(--color-pixel-accent)] text-[var(--color-pixel-bg)] border-[var(--color-pixel-accent)]'
              : 'bg-[var(--color-pixel-bg)] text-[var(--color-pixel-text)] hover:border-[var(--color-pixel-accent)]'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span className="text-[var(--color-pixel-text-dim)] mr-2">
            [{index + 1}]
          </span>
          {choice}
        </button>
      ))}

      {/* Keyboard hint */}
      <div className="text-[8px] text-[var(--color-pixel-text-dim)] mt-1 px-1">
        Press 1-{choices.length} to select, or type below
      </div>
    </div>
  );
}

// Hook for keyboard selection
export function useChoiceKeyboard(
  choices: string[],
  onSelect: (choice: string) => void,
  enabled: boolean = true
) {
  // This would be used in the parent component
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!enabled || choices.length === 0) return;

    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= choices.length) {
      onSelect(choices[num - 1]);
    }
  };

  return { handleKeyDown };
}
